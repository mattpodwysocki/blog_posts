/**
 * OAuth configuration for Mapbox MCP Server (via hosted server)
 * The hosted server proxies requests to Mapbox's OAuth endpoints
 */
export const OAUTH_CONFIG = {
  // Hosted server OAuth endpoints
  authorizationEndpoint: 'https://api.mapbox.com/oauth/authorize',
  tokenEndpoint: 'https://mcp.mapbox.com/oauth/token', // Proxied by hosted server
  registrationEndpoint: 'https://api.mapbox.com/oauth/register',
  clientId: process.env.NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID || '',
  redirectUri:
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ||
    'http://localhost:3000/auth/callback',
  scope: 'styles:tiles styles:read fonts:read datasets:read',
};

/**
 * Register a new OAuth client dynamically with Mapbox
 * Uses OAuth 2.0 Dynamic Client Registration Protocol (RFC 7591)
 */
export async function registerOAuthClient(applicationName: string): Promise<{
  client_id: string;
  client_secret: string;
}> {
  const response = await fetch(
    `${OAUTH_CONFIG.registrationEndpoint}?scope=${encodeURIComponent(OAUTH_CONFIG.scope)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_name: applicationName,
        redirect_uris: [OAUTH_CONFIG.redirectUri],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register OAuth client: ${error}`);
  }

  return response.json();
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate the OAuth authorization URL
 */
export function getAuthorizationUrl(state: string, clientId?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId || OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    state,
  });

  return `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  // Get client credentials from storage or env
  const credentials = clientStorage.get();
  const clientId = credentials?.client_id || OAUTH_CONFIG.clientId;
  const clientSecret = credentials?.client_secret;

  if (!clientId) {
    throw new Error('No client ID available for token exchange');
  }

  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
  };

  // Add client_secret if available (required for confidential clients)
  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Validate a Mapbox access token format
 */
export function isValidTokenFormat(token: string): boolean {
  // Mapbox tokens start with 'pk.' (public) or 'sk.' (secret)
  return token.startsWith('pk.') || token.startsWith('sk.');
}

/**
 * Token storage helpers (using sessionStorage)
 */
export const tokenStorage = {
  set(token: string) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mapbox_mcp_token', token);
    }
  },
  get(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mapbox_mcp_token');
    }
    return null;
  },
  clear() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mapbox_mcp_token');
    }
  },
};

/**
 * Client credentials storage helpers (using localStorage for persistence)
 */
export const clientStorage = {
  set(clientId: string, clientSecret: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mapbox_oauth_client_id', clientId);
      localStorage.setItem('mapbox_oauth_client_secret', clientSecret);
    }
  },
  get(): { client_id: string; client_secret: string } | null {
    if (typeof window !== 'undefined') {
      const client_id = localStorage.getItem('mapbox_oauth_client_id');
      const client_secret = localStorage.getItem('mapbox_oauth_client_secret');
      if (client_id && client_secret) {
        return { client_id, client_secret };
      }
    }
    return null;
  },
  clear() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mapbox_oauth_client_id');
      localStorage.removeItem('mapbox_oauth_client_secret');
    }
  },
};
