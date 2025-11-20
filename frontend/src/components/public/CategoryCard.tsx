import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  name: string;
  slug: string;
  icon?: string;
  studioCount?: number;
  imageUrl?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  slug,
  icon,
  studioCount = 0,
  imageUrl,
}) => {
  return (
    <Link
      to={`/categories/${slug}`}
      className="block group relative overflow-hidden rounded-xl bg-white shadow-soft hover:shadow-medium transition-all duration-300"
    >
      {/* Background Image or Gradient */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {icon ? (
              <span className="text-6xl">{icon}</span>
            ) : (
              <span className="text-5xl font-bold text-primary-600">{name.charAt(0)}</span>
            )}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold mb-1">{name}</h3>
        <p className="text-sm text-white/90">{studioCount} studios</p>
      </div>
    </Link>
  );
};
