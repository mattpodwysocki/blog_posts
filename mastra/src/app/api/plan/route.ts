import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation, calculateRoute } from '@/lib/mcp';
import type { Attraction, Location, RouteData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attractions } = body as { attractions: Attraction[] };

    if (!attractions || attractions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 attractions are required' },
        { status: 400 }
      );
    }

    // Step 1: Geocode all attractions
    console.log('Geocoding attractions...');
    const locations: Location[] = [];

    for (const attraction of attractions) {
      try {
        const location = await geocodeLocation(attraction.address);
        locations.push({
          name: attraction.name,
          coordinates: location.coordinates,
        });
      } catch (error) {
        console.error(`Failed to geocode ${attraction.name}:`, error);
        return NextResponse.json(
          { error: `Failed to geocode ${attraction.name}` },
          { status: 500 }
        );
      }
    }

    // Step 2: Calculate route
    console.log('Calculating route...');
    const coordinates = locations.map(loc => loc.coordinates);
    const route = await calculateRoute(coordinates);

    // Step 3: Format response
    const routeData: RouteData = {
      locations,
      route: {
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
      },
      distance: route.distance * 0.000621371, // meters to miles
      duration: Math.round(route.duration / 60), // seconds to minutes
    };

    return NextResponse.json(routeData);
  } catch (error) {
    console.error('Error planning route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to plan route' },
      { status: 500 }
    );
  }
}
