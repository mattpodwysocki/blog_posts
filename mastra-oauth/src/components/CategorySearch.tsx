'use client';

import { useState } from 'react';

interface SearchResult {
  name: string;
  coordinates: [number, number];
  address?: string;
}

interface CategorySearchProps {
  onAddLocation: (location: SearchResult) => void;
  onShowResults: (results: SearchResult[]) => void;
  accessToken: string;
}

const PRESET_CATEGORIES = [
  { label: 'Coffee Shops', value: 'coffee' },
  { label: 'Restaurants', value: 'restaurant' },
  { label: 'Museums', value: 'museum' },
  { label: 'Parks', value: 'park' },
];

const PROXIMITY_LOCATIONS = [
  { label: 'White House', coords: { longitude: -77.0365, latitude: 38.8977 } },
  { label: 'Capitol Hill', coords: { longitude: -77.0090, latitude: 38.8899 } },
  { label: 'National Mall', coords: { longitude: -77.0199, latitude: 38.8893 } },
];

export default function CategorySearch({ onAddLocation, onShowResults, accessToken }: CategorySearchProps) {
  const [customCategory, setCustomCategory] = useState('');
  const [selectedProximity, setSelectedProximity] = useState(PROXIMITY_LOCATIONS[0]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (category: string) => {
    if (!category.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/category-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category.toLowerCase(),
          proximity: selectedProximity.coords,
          accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Search Nearby</h3>
        <p className="text-xs text-gray-600 mb-3">
          Find places near a location
        </p>
      </div>

      {/* Proximity selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Near:
        </label>
        <select
          value={PROXIMITY_LOCATIONS.findIndex(l => l.label === selectedProximity.label)}
          onChange={(e) => setSelectedProximity(PROXIMITY_LOCATIONS[parseInt(e.target.value)])}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROXIMITY_LOCATIONS.map((loc, idx) => (
            <option key={idx} value={idx}>
              {loc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preset category buttons */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Quick search:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleSearch(cat.value)}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom category input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Or search for:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(customCategory)}
            placeholder="e.g. bakery, hotel, bar"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={() => handleSearch(customCategory)}
            disabled={loading || !customCategory.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-sm text-gray-600 text-center py-4">
          Searching...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-900">
              Results ({searchResults.length}):
            </h4>
            <button
              onClick={() => onShowResults(searchResults)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Show on Map
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-gray-200 rounded-md hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.name}
                    </p>
                    {result.address && (
                      <p className="text-xs text-gray-600 truncate">
                        {result.address}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onAddLocation(result);
                      setSearchResults([]);
                      setCustomCategory('');
                    }}
                    className="flex-shrink-0 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
