'use client';

import { useEffect, useRef } from 'react';
import Map, { Layer, Source, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import type { RouteData } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SearchResult {
  name: string;
  coordinates: [number, number];
  address?: string;
}

interface DCMapProps {
  routeData: RouteData | null;
  searchResults?: SearchResult[];
}

export default function DCMap({ routeData, searchResults }: DCMapProps) {
  const mapRef = useRef<any>(null);

  // Fit map to show all markers when route or search results change
  useEffect(() => {
    if (!mapRef.current) return;

    const locations = routeData?.locations || [];
    const results = searchResults || [];
    const allPoints = [...locations, ...results];

    if (allPoints.length > 0) {
      const bounds = allPoints.reduce(
        (bounds, item) => {
          return bounds.extend(item.coordinates);
        },
        new mapboxgl.LngLatBounds(
          allPoints[0].coordinates,
          allPoints[0].coordinates
        )
      );

      mapRef.current.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
      });
    }
  }, [routeData, searchResults]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        latitude: 38.9072,
        longitude: -77.0369,
        zoom: 12,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {/* Route line */}
      {routeData?.route && (
        <Source type="geojson" data={routeData.route}>
          <Layer
            id="route"
            type="line"
            paint={{
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}

      {/* Route location markers (numbered, blue) */}
      {routeData?.locations.map((location, index) => (
        <Marker
          key={`route-${index}`}
          latitude={location.coordinates[1]}
          longitude={location.coordinates[0]}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
              {index + 1}
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap z-10">
              {location.name}
            </div>
          </div>
        </Marker>
      ))}

      {/* Search result markers (dots, green) */}
      {searchResults?.map((result, index) => (
        <Marker
          key={`search-${index}`}
          latitude={result.coordinates[1]}
          longitude={result.coordinates[0]}
        >
          <div className="relative">
            <div className="w-6 h-6 bg-green-600 rounded-full shadow-lg border-2 border-white" />
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap z-10">
              {result.name}
            </div>
          </div>
        </Marker>
      ))}
    </Map>
  );
}
