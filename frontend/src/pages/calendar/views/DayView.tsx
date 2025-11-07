import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useCalendar, generateTimeSlots, calculateAppointmentPosition } from '@/contexts/CalendarContext';
import { AppointmentBlock } from '../components/AppointmentBlock';
import type { CalendarData, CalendarAppointment } from '@/types/calendar.types';

interface DayViewProps {
  calendarData: CalendarData;
}

export const DayView: React.FC<DayViewProps> = ({ calendarData }) => {
  const { state, actions } = useCalendar();
  const containerRef = useRef<HTMLDivElement>(null);

  // Business hours from calendar data (default 8 AM - 8 PM)
  const businessHours = calendarData.business_hours.find((bh) => bh.day_of_week === state.currentDate.getDay());
  const startHour = businessHours && businessHours.is_open
    ? parseInt(businessHours.open_time.split(':')[0])
    : 8;
  const endHour = businessHours && businessHours.is_open
    ? parseInt(businessHours.close_time.split(':')[0])
    : 20;

  // Generate time slots
  const timeSlots = generateTimeSlots(startHour, endHour, 15);

  // Filter appointments for current day
  const dayAppointments = calendarData.appointments.filter((apt) => {
    const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
    const currentDate = format(state.currentDate, 'yyyy-MM-dd');
    return aptDate === currentDate;
  });

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= startHour && currentHour <= endHour) {
        const scrollPosition = ((currentHour - startHour) / (endHour - startHour)) * containerRef.current.scrollHeight;
        containerRef.current.scrollTop = scrollPosition - 100;
      } else if (currentHour < startHour) {
        containerRef.current.scrollTop = 0;
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [startHour, endHour]);

  // Calculate current time indicator position
  const getCurrentTimePosition = (): number | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < startHour || currentHour > endHour) {
      return null;
    }

    const totalMinutes = (endHour - startHour) * 60;
    const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
    return (minutesSinceStart / totalMinutes) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    actions.selectAppointment(appointment.id);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-white">
      <div className="relative" style={{ minHeight: '100%' }}>
        {/* Time axis */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gray-50 border-r border-gray-200">
          {timeSlots.map((slot, index) => {
            // Only show labels on the hour
            if (slot.minute === 0) {
              return (
                <div
                  key={slot.time}
                  className="absolute text-xs text-gray-500 pr-2 text-right"
                  style={{
                    top: `${(index / timeSlots.length) * 100}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {slot.label}
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute left-20 right-0 top-0 bottom-0">
          {timeSlots.map((slot, index) => (
            <div
              key={slot.time}
              className={`absolute left-0 right-0 border-t ${
                slot.minute === 0 ? 'border-gray-300' : 'border-gray-100'
              }`}
              style={{ top: `${(index / timeSlots.length) * 100}%` }}
            />
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && format(new Date(), 'yyyy-MM-dd') === format(state.currentDate, 'yyyy-MM-dd') && (
            <div
              className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          )}

          {/* Appointments */}
          <div className="relative h-full">
            {dayAppointments.map((appointment) => {
              const position = calculateAppointmentPosition(
                appointment.start_time,
                appointment.end_time,
                startHour,
                endHour
              );

              return (
                <AppointmentBlock
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => handleAppointmentClick(appointment)}
                  style={{
                    position: 'absolute',
                    top: `${position.top}%`,
                    height: `${position.height}%`,
                    left: '0.5rem',
                    right: '0.5rem',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {dayAppointments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>No appointments scheduled for this day</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
