/**
 * Skeleton Loading Components
 * Provides placeholder UI while content is loading
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // Default heights for text variant
  if (variant === 'text' && !height) {
    style.height = '1em';
  }

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <Skeleton variant="rectangular" height={120} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
};

// Table Row Skeleton
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
};

// Table Skeleton
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// List Item Skeleton
export const SkeletonListItem: React.FC<{ withAvatar?: boolean }> = ({ withAvatar = false }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
      {withAvatar && <Skeleton variant="circular" width={40} height={40} />}
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="70%" />
      </div>
    </div>
  );
};

// List Skeleton
export const SkeletonList: React.FC<{ items?: number; withAvatar?: boolean }> = ({
  items = 5,
  withAvatar = false,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} withAvatar={withAvatar} />
      ))}
    </div>
  );
};

// Form Field Skeleton
export const SkeletonFormField: React.FC = () => {
  return (
    <div className="space-y-2">
      <Skeleton variant="text" width={100} height={16} />
      <Skeleton variant="rectangular" height={40} />
    </div>
  );
};

// Form Skeleton
export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonFormField key={i} />
      ))}
      <Skeleton variant="rectangular" height={40} width={120} className="mt-6" />
    </div>
  );
};

// Dashboard Metric Card Skeleton
export const SkeletonMetricCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="50%" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
    </div>
  );
};

// Calendar Day Cell Skeleton
export const SkeletonCalendarDay: React.FC = () => {
  return (
    <div className="border border-gray-200 p-2 min-h-[100px]">
      <Skeleton variant="text" width={24} height={24} className="mb-2" />
      <div className="space-y-1">
        <Skeleton variant="rectangular" height={16} className="mb-1" />
        <Skeleton variant="rectangular" height={16} />
      </div>
    </div>
  );
};

// Calendar Skeleton
export const SkeletonCalendar: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <Skeleton variant="text" width="40%" height={32} />
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonCalendarDay key={i} />
        ))}
      </div>
    </div>
  );
};

// Profile Header Skeleton
export const SkeletonProfileHeader: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-6">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    </div>
  );
};

// Chart Skeleton
export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton variant="text" width="40%" height={24} className="mb-6" />
      <Skeleton variant="rectangular" height={height} />
    </div>
  );
};

// Appointment Card Skeleton
export const SkeletonAppointmentCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="rectangular" width={80} height={24} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    </div>
  );
};

// Page Header Skeleton
export const SkeletonPageHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <Skeleton variant="text" width="40%" height={32} className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
};

// Stats Grid Skeleton
export const SkeletonStatsGrid: React.FC<{ items?: number }> = ({ items = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
};

// Search Bar Skeleton
export const SkeletonSearchBar: React.FC = () => {
  return <Skeleton variant="rectangular" height={40} className="mb-4" />;
};

// Button Skeleton
export const SkeletonButton: React.FC<{ width?: number }> = ({ width = 120 }) => {
  return <Skeleton variant="rectangular" width={width} height={40} />;
};
