import React from 'react';
import { getStatusColor, getStatusLabel } from '@/contexts/CalendarContext';
import type { AppointmentStatus } from '@/types/calendar.types';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${colorClass} ${sizeClasses}`}
    >
      {label}
    </span>
  );
};
