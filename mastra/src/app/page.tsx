'use client';

import { useState } from 'react';
import DCMap from '@/components/DCMap';
import { RouteData } from '@/types';

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
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);
    setRouteData(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Washington, DC Tour Assistant
          </h1>
          <p className="text-sm text-gray-600">
            Ask me anything about Washington DC in natural language
          </p>
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
