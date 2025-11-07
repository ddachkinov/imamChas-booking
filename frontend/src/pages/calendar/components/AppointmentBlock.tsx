import React from 'react';
import { format } from 'date-fns';
import { getStatusColor } from '@/contexts/CalendarContext';
import type { CalendarAppointment } from '@/types/calendar.types';

interface AppointmentBlockProps {
  appointment: CalendarAppointment;
  style?: React.CSSProperties;
  onClick?: () => void;
  compact?: boolean;
}

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  appointment,
  style,
  onClick,
  compact = false,
}) => {
  const statusColor = getStatusColor(appointment.status);

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        ${statusColor} bg-opacity-90 hover:bg-opacity-100
        rounded border-l-4 border-opacity-100
        p-2 cursor-pointer
        transition-all duration-150
        shadow-sm hover:shadow-md
        ${compact ? 'text-xs' : 'text-sm'}
      `}
      title={`${appointment.client_name} - ${appointment.service_name}`}
    >
      <div className="text-white">
        <div className="font-semibold truncate">{appointment.client_name}</div>
        {!compact && (
          <>
            <div className="truncate text-white text-opacity-90">{appointment.service_name}</div>
            <div className="text-xs text-white text-opacity-80 mt-1">
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </div>
            {appointment.staff_name && (
              <div className="text-xs text-white text-opacity-80">
                with {appointment.staff_name}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
