'use client';

import { useState, useEffect } from 'react';
import DCMap from '@/components/DCMap';
import { RouteData } from '@/types';
import { generateState, getAuthorizationUrl, tokenStorage, clientStorage, registerOAuthClient, exchangeCodeForToken } from '@/lib/oauth';

interface SearchResult {
  name: string;
  coordinates: [number, number];
  address?: string;
}

const EXAMPLE_QUERIES = [
  "Show me coffee shops near the White House",
  "Find restaurants near Capitol Hill",
  "Plan a walking route from the Lincoln Memorial to the Washington Monument to the Capitol",
];

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Check for access token on mount and from URL hash
  useEffect(() => {
    const storedToken = tokenStorage.get();
    if (storedToken) {
      setAccessToken(storedToken);
      return;
    }

    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const code = params.get('code');
      const state = params.get('state');
      const token = params.get('access_token');

      if (token) {
        tokenStorage.set(token);
        setAccessToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (code && state) {
        setLoading(true);
        exchangeCodeForToken(code)
          .then((tokenData) => {
            tokenStorage.set(tokenData.access_token);
            setAccessToken(tokenData.access_token);
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setError(`Token exchange failed: ${err.message}`);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(`OAuth error: ${oauthError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      let credentials = clientStorage.get();

      if (!credentials && !process.env.NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID) {
        setError('Registering OAuth client...');
        credentials = await registerOAuthClient('DC Tour Planner');
        clientStorage.set(credentials.client_id, credentials.client_secret);
      }

      const state = generateState();
      sessionStorage.setItem('oauth_state', state);

      const clientId = credentials?.client_id || process.env.NEXT_PUBLIC_MAPBOX_OAUTH_CLIENT_ID || '';
      window.location.href = getAuthorizationUrl(state, clientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth flow');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setAccessToken(null);
    setQuery('');
    setAiResponse(null);
    setRouteData(null);
    setSearchResults([]);
    setError(null);
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !accessToken) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);
    setRouteData(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, accessToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data = await response.json();
      setAiResponse(data.text);

      if (data.type === 'search_results' && data.searchResults) {
        setSearchResults(data.searchResults);
      } else if (data.type === 'route' && data.routeData) {
        setRouteData(data.routeData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show login screen if not authenticated
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Washington, DC Tour Assistant
            </h1>
            <p className="text-gray-600 mb-6">
              Ask me anything about Washington DC in natural language using AI + Mapbox MCP
            </p>
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Login with Mapbox
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                This demo uses Claude AI with Mapbox MCP (OAuth)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              DC Tour Assistant
            </h1>
            <p className="text-sm text-gray-600">
              Ask me anything about Washington DC in natural language
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1">
          <DCMap routeData={routeData} searchResults={searchResults} />
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Example Queries */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Try asking:
            </h3>
            <div className="space-y-2">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(example)}
                  className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response */}
          <div className="flex-1 overflow-y-auto p-6">
            {aiResponse && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Response:
                </h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {aiResponse}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Query Input */}
          <div className="p-6 border-t border-gray-200">
            <form onSubmit={handleSubmitQuery}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about DC..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
