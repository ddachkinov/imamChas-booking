import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface ServiceCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  imageUrl?: string;
  onBook?: () => void;
  showBookButton?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  description,
  price,
  duration,
  category,
  imageUrl,
  onBook,
  showBookButton = true,
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Image */}
        {imageUrl && (
          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category */}
          {category && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {category}
            </div>
          )}

          {/* Name */}
          <h4 className="text-base font-semibold text-gray-900 mb-1">
            {name}
          </h4>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Duration & Price */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {price.toFixed(2)} лв
              </div>
            </div>

            {/* Book Button */}
            {showBookButton && onBook && (
              <button
                onClick={onBook}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
