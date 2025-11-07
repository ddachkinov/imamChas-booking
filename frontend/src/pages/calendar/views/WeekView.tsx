import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useCalendar, generateTimeSlots, calculateAppointmentPosition } from '@/contexts/CalendarContext';
import { AppointmentBlock } from '../components/AppointmentBlock';
import type { CalendarData, CalendarAppointment } from '@/types/calendar.types';

interface WeekViewProps {
  calendarData: CalendarData;
}

export const WeekView: React.FC<WeekViewProps> = ({ calendarData }) => {
  const { state, actions } = useCalendar();

  // Get week start (Sunday)
  const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Business hours (default 8 AM - 8 PM)
  const startHour = 8;
  const endHour = 20;

  // Generate time slots (hourly for week view)
  const timeSlots = generateTimeSlots(startHour, endHour, 60);

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    actions.selectAppointment(appointment.id);
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): CalendarAppointment[] => {
    return calendarData.appointments.filter((apt) => {
      const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
      const dayDate = format(date, 'yyyy-MM-dd');
      return aptDate === dayDate;
    });
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="min-w-[800px]">
        {/* Header with day names */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
            <div className="border-r border-gray-200"></div>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toString()}
                  className={`p-3 text-center border-r border-gray-200 ${
                    isToday ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{format(day, 'EEE')}</div>
                  <div
                    className={`text-2xl font-semibold mt-1 ${
                      isToday ? 'text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid grid-cols-[80px_repeat(7,1fr)]" style={{ minHeight: '600px' }}>
            {/* Time labels column */}
            <div className="border-r border-gray-200 bg-gray-50">
              {timeSlots.map((slot) => (
                <div
                  key={slot.time}
                  className="text-xs text-gray-500 text-right pr-2 border-b border-gray-100"
                  style={{ height: '60px' }}
                >
                  {slot.label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`relative border-r border-gray-200 ${
                    isToday ? 'bg-primary-50 bg-opacity-30' : ''
                  }`}
                >
                  {/* Hour grid lines */}
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className="border-b border-gray-100"
                      style={{ height: '60px' }}
                    />
                  ))}

                  {/* Appointments */}
                  <div className="absolute inset-0">
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
                          compact
                          style={{
                            position: 'absolute',
                            top: `${position.top}%`,
                            height: `${position.height}%`,
                            left: '2px',
                            right: '2px',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
