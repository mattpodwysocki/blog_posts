import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Get an MCP client configured for OAuth with the hosted server
 */
async function getMCPClient(accessToken: string): Promise<Client> {
  // Use StreamableHTTPClientTransport with custom fetch that includes auth header
  const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };

  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.mapbox.com/mcp'),
    {
      fetch: customFetch,
    }
  );

  const client = new Client(
    {
      name: 'dc-tour-planner-oauth',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  return client;
}

/**
 * Call a tool using the MCP SDK request pattern
 */
async function callMCPTool(
  toolName: string,
  toolArgs: Record<string, any>,
  accessToken: string
) {
  const client = await getMCPClient(accessToken);

  const request: CallToolRequest = {
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: toolArgs,
    },
  };

  const result = await client.request(request, CallToolResultSchema);
  return result;
}

export async function geocodeLocation(address: string, accessToken: string) {
  const result = await callMCPTool(
    'search_and_geocode_tool',
    {
      q: address,
      proximity: {
        longitude: -77.0369,
        latitude: 38.9072,
      },
      country: ['us'],
    },
    accessToken
  );

  // Check for errors
  if (result.isError) {
    const firstContent = result.content[0];
    if (firstContent.type === 'text') {
      throw new Error(`MCP tool error: ${firstContent.text}`);
    }
    throw new Error('MCP tool returned an error');
  }

  // Use structuredContent for the raw GeoJSON data
  const data = result.structuredContent as any;
  if (!data || !data.features || data.features.length === 0) {
    throw new Error(`Could not geocode: ${address}`);
  }

  const feature = data.features[0];
  return {
    name: feature.properties.name || feature.properties.full_address,
    coordinates: feature.geometry.coordinates as [number, number],
  };
}

export async function categorySearch(
  category: string,
  proximity: { longitude: number; latitude: number },
  accessToken: string
) {
  const result = await callMCPTool(
    'category_search_tool',
    {
      category,
      proximity,
      country: ['us'],
      limit: 10,
      format: 'json_string',
    },
    accessToken
  );

  // Check for errors
  if (result.isError) {
    const firstContent = result.content[0];
    if (firstContent.type === 'text') {
      throw new Error(`MCP tool error: ${firstContent.text}`);
    }
    throw new Error('MCP tool returned an error');
  }

  // Use structuredContent for the raw GeoJSON data
  const data = result.structuredContent as any;
  if (!data || !data.features || data.features.length === 0) {
    return [];
  }

  return data.features.map((feature: any) => ({
    name: feature.properties.name || feature.properties.full_address,
    coordinates: feature.geometry.coordinates as [number, number],
    address: feature.properties.full_address || feature.properties.place_formatted,
  }));
}

export async function calculateRoute(
  coordinates: [number, number][],
  accessToken: string
) {
  // Convert [lng, lat] arrays to {longitude, latitude} objects
  const coordinateObjects = coordinates.map(([longitude, latitude]) => ({
    longitude,
    latitude,
  }));

  const result = await callMCPTool(
    'directions_tool',
    {
      coordinates: coordinateObjects,
      routing_profile: 'walking',
      geometries: 'geojson',
    },
    accessToken
  );

  // Check for errors
  if (result.isError) {
    const firstContent = result.content[0];
    if (firstContent.type === 'text') {
      throw new Error(`MCP tool error: ${firstContent.text}`);
    }
    throw new Error('MCP tool returned an error');
  }

  // Use structuredContent for the raw API data
  const data = result.structuredContent as any;
  if (!data || !data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes[0];
}
