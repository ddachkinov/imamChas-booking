import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // Percentage change (positive or negative)
  icon: React.ReactNode;
  iconColor: string;
  iconBgColor: string;
  format?: 'currency' | 'number' | 'percentage' | 'duration';
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  iconColor,
  iconBgColor,
  format = 'number',
  subtitle,
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'duration':
        // Value is in minutes
        const hours = Math.floor(val / 60);
        const minutes = val % 60;
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const isPositiveChange = change !== undefined && change >= 0;
  const hasChange = change !== undefined && change !== 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>

          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}

          {hasChange && (
            <div className="flex items-center mt-2">
              {isPositiveChange ? (
                <ArrowUpIcon className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositiveChange ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(change!).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>

        <div className={`p-4 rounded-lg ${iconBgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
};
