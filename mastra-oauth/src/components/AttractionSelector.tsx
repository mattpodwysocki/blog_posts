'use client';

import type { Attraction } from '@/types';

interface AttractionSelectorProps {
  attractions: Attraction[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function AttractionSelector({
  attractions,
  selectedIds,
  onSelectionChange,
}: AttractionSelectorProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">
        Select Attractions ({selectedIds.length} selected)
      </h2>
      <div className="space-y-2">
        {attractions.map(attraction => {
          const isSelected = selectedIds.includes(attraction.id);
          return (
            <label
              key={attraction.id}
              className={`
                flex items-center p-3 rounded-md border-2 cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(attraction.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                {attraction.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
