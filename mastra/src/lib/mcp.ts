import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

let mcpClient: Client | null = null;

export async function getMCPClient() {
  if (mcpClient) {
    return mcpClient;
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@mapbox/mcp-server'],
    env: {
      ...process.env,
      MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN!,
    },
  });

  mcpClient = new Client(
    {
      name: 'dc-tour-planner',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await mcpClient.connect(transport);

  return mcpClient;
}

export async function geocodeLocation(address: string) {
  const client = await getMCPClient();

  const request: CallToolRequest = {
    method: 'tools/call',
    params: {
      name: 'search_and_geocode_tool',
      arguments: {
        q: address,
        proximity: {
          longitude: -77.0369,
          latitude: 38.9072,
        },
        country: ['us'],
      },
    },
  };

  const result = await client.request(request, CallToolResultSchema);

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
  proximity: { longitude: number; latitude: number }
) {
  const client = await getMCPClient();

  const request: CallToolRequest = {
    method: 'tools/call',
    params: {
      name: 'category_search_tool',
      arguments: {
        category,
        proximity,
        country: ['us'],
        limit: 10,
        format: 'json_string',
      },
    },
  };

  const result = await client.request(request, CallToolResultSchema);

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

export async function calculateRoute(coordinates: [number, number][]) {
  const client = await getMCPClient();

  // Convert [lng, lat] arrays to {longitude, latitude} objects
  const coordinateObjects = coordinates.map(([longitude, latitude]) => ({
    longitude,
    latitude,
  }));

  const request: CallToolRequest = {
    method: 'tools/call',
    params: {
      name: 'directions_tool',
      arguments: {
        coordinates: coordinateObjects,
        routing_profile: 'walking',
        geometries: 'geojson',
      },
    },
  };

  const result = await client.request(request, CallToolResultSchema);

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
