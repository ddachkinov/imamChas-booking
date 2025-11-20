import React, { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ variant = 'hero', className = '' }) => {
  const navigate = useNavigate();
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (location) params.append('location', location);
    if (date) params.append('date', date);

    navigate(`/search?${params.toString()}`);
  };

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className={`w-full ${className}`}>
        <div className="flex items-center bg-white rounded-lg shadow-medium overflow-hidden">
          <div className="flex-1 flex items-center px-4 py-3 border-r border-gray-200">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search services..."
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className="bg-white rounded-2xl shadow-hard overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200">
          {/* Service Input */}
          <div className="bg-white px-6 py-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              What
            </label>
            <div className="flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Haircut, Manicure, Massage..."
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-lg"
              />
            </div>
          </div>

          {/* Location Input */}
          <div className="bg-white px-6 py-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Where
            </label>
            <div className="flex items-center">
              <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Sofia, Plovdiv, Varna..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-lg"
              />
            </div>
          </div>

          {/* Date Input */}
          <div className="bg-white px-6 py-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              When
            </label>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors duration-200 shadow-soft hover:shadow-medium"
          >
            Search Studios
          </button>
        </div>
      </div>
    </form>
  );
};
