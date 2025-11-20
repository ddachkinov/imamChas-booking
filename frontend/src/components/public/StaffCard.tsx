import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface StaffCardProps {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  onSelect?: () => void;
  isSelected?: boolean;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  name,
  role,
  bio,
  photoUrl,
  rating,
  reviewCount,
  specialties = [],
  onSelect,
  isSelected = false,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-primary-500 shadow-medium'
          : 'border-gray-200 hover:border-primary-300 hover:shadow-soft'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-gray-100">
                <span className="text-xl font-bold text-white">
                  {name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              {name}
            </h4>

            {role && (
              <p className="text-sm text-gray-600 mb-2">{role}</p>
            )}

            {/* Rating */}
            {rating !== undefined && rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <StarIcon className="w-4 h-4 text-warning-500" />
                <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
                {reviewCount !== undefined && reviewCount > 0 && (
                  <span className="text-sm text-gray-500">({reviewCount})</span>
                )}
              </div>
            )}

            {/* Bio */}
            {bio && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {bio}
              </p>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
                {specialties.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{specialties.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Selected Indicator */}
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
