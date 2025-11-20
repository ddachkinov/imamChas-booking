import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

interface StudioCardProps {
  id: string;
  slug: string;
  name: string;
  category: string;
  coverImage?: string;
  address: {
    city?: string;
    area?: string;
  };
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  isOpen?: boolean;
  nextAvailable?: string;
}

export const StudioCard: React.FC<StudioCardProps> = ({
  slug,
  name,
  category,
  coverImage,
  address,
  rating = 0,
  reviewCount = 0,
  verified = false,
  isOpen = true,
  nextAvailable,
}) => {
  return (
    <Link to={`/studios/${slug}`} className="block group">
      <div className="bg-white rounded-xl shadow-soft hover:shadow-medium transition-shadow duration-300 overflow-hidden">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <span className="text-4xl font-bold text-primary-600">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Verified Badge */}
          {verified && (
            <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-gray-700">Verified</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            {isOpen ? (
              <span className="bg-success-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                Open now
              </span>
            ) : (
              <span className="bg-gray-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <div className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            {category}
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <MapPinIcon className="w-4 h-4" />
            <span>{address.area ? `${address.area}, ` : ''}{address.city || 'Location'}</span>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {rating > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-5 h-5 text-warning-500" />
                    <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-500">({reviewCount})</span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}
            </div>

            {/* Next Available */}
            {nextAvailable && isOpen && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>{nextAvailable}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
