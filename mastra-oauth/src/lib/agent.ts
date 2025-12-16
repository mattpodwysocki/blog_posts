import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { geocodeLocation, categorySearch, calculateRoute } from './mcp';

interface SearchResult {
  name: string;
  coordinates: [number, number];
  address?: string;
}

interface RouteData {
  locations: Array<{ name: string; coordinates: [number, number] }>;
  route: any; // GeoJSON geometry
  distance: string; // in miles
  duration: number; // in minutes
}

interface AgentResponse {
  type: 'search_results' | 'route' | 'text';
  searchResults?: SearchResult[];
  routeData?: RouteData;
  text: string;
}

// Store results from tool executions for the UI
let capturedSearchResults: SearchResult[] | undefined;
let capturedRouteData: RouteData | undefined;

// Create Mastra tools
const createSearchLocationTool = (accessToken: string) =>
  createTool({
    id: 'search-location',
    description: 'Search for a specific place by name or address in Washington DC',
    inputSchema: z.object({
      query: z.string().describe('The place name or address to search for'),
    }),
    outputSchema: z.object({
      name: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
    }),
    execute: async ({ query }) => {
      const result = await geocodeLocation(query, accessToken);
      return result;
    },
  });

const createSearchCategoryTool = (accessToken: string) =>
  createTool({
    id: 'search-category',
    description:
      'Find places of a certain category (coffee, restaurant, museum, park, etc.) near a location in Washington DC',
    inputSchema: z.object({
      category: z.string().describe('The type of place to search for (e.g., coffee, restaurant, museum)'),
      near: z.string().describe('The location to search near (e.g., "White House", "Capitol Hill")'),
    }),
    outputSchema: z.object({
      count: z.number(),
      results: z.array(
        z.object({
          name: z.string(),
          coordinates: z.tuple([z.number(), z.number()]),
          address: z.string().optional(),
        })
      ),
    }),
    execute: async ({ category, near }) => {
      // First geocode the "near" location to get coordinates
      const nearLocation = await geocodeLocation(near, accessToken);
      const results = await categorySearch(
        category,
        {
          longitude: nearLocation.coordinates[0],
          latitude: nearLocation.coordinates[1],
        },
        accessToken
      );
      // Capture for UI
      capturedSearchResults = results;
      return { count: results.length, results };
    },
  });

const createPlanRouteTool = (accessToken: string) =>
  createTool({
    id: 'plan-route',
    description: 'Plan a walking route between multiple locations in Washington DC',
    inputSchema: z.object({
      locations: z.array(z.string()).min(2).describe('Array of location names to visit in order (at least 2)'),
    }),
    outputSchema: z.object({
      distance: z.string(),
      duration: z.number(),
    }),
    execute: async ({ locations }) => {
      // Geocode all locations
      const geocoded = await Promise.all(locations.map((loc) => geocodeLocation(loc, accessToken)));

      // Calculate route
      const coords = geocoded.map((loc) => loc.coordinates);
      const route = await calculateRoute(coords, accessToken);

      // Capture for UI
      capturedRouteData = {
        locations: geocoded,
        route: route.geometry,
        distance: (route.distance * 0.000621371).toFixed(2), // meters to miles
        duration: Math.round(route.duration / 60), // seconds to minutes
      };

      return {
        distance: capturedRouteData.distance,
        duration: capturedRouteData.duration,
      };
    },
  });

export async function processNaturalLanguageQuery(query: string, accessToken: string): Promise<AgentResponse> {
  // Clear captured data
  capturedSearchResults = undefined;
  capturedRouteData = undefined;

  // Create tools with access token
  const searchLocationTool = createSearchLocationTool(accessToken);
  const searchCategoryTool = createSearchCategoryTool(accessToken);
  const planRouteTool = createPlanRouteTool(accessToken);

  // Create Mastra agent
  const dcAgent = new Agent({
    id: 'dc-tour-agent',
    name: 'DC Tour Planning Agent',
    instructions: `You are a helpful Washington DC tour assistant. You can help users:
1. Find places (specific addresses or POIs)
2. Search for categories of places (coffee shops, restaurants, museums, etc.)
3. Plan walking routes between locations

Examples:
- "Show me coffee shops near the White House" → use search-category with category="coffee" and near="White House"
- "Find the Lincoln Memorial" → use search-location with query="Lincoln Memorial"
- "Plan a route from the Capitol to the Air and Space Museum" → use plan-route with locations=["US Capitol", "Smithsonian National Air and Space Museum"]

Always respond concisely and use tools when appropriate.`,
    model: 'anthropic/claude-3-7-sonnet-latest',
    tools: {
      searchLocationTool,
      searchCategoryTool,
      planRouteTool,
    },
  });

  // Execute query with Mastra agent
  const result = await dcAgent.generate(query);

  // Determine response type based on what data we captured
  let type: 'search_results' | 'route' | 'text' = 'text';
  if (capturedSearchResults) type = 'search_results';
  if (capturedRouteData) type = 'route';

  return {
    type,
    searchResults: capturedSearchResults,
    routeData: capturedRouteData,
    text: result.text || 'No response',
  };
}
