import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '@/contexts/CalendarContext';

export const CalendarSearch: React.FC = () => {
  const { state, actions } = useCalendar();
  const [localQuery, setLocalQuery] = useState(state.filters.search_query || '');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== state.filters.search_query) {
        actions.setSearchQuery(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, state.filters.search_query, actions]);

  const handleClear = () => {
    setLocalQuery('');
    actions.setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="block w-full rounded-md border-gray-300 pl-10 pr-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        placeholder="Search appointments..."
      />
      {localQuery && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            onClick={handleClear}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};
