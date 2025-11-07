import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { useCalendar, filterAppointments } from '@/contexts/CalendarContext';
import type { CalendarData } from '@/types/calendar.types';

interface MonthViewProps {
  calendarData: CalendarData;
}

export const MonthView: React.FC<MonthViewProps> = ({ calendarData }) => {
  const { state, actions } = useCalendar();

  // Get month grid (6 weeks = 42 days)
  const monthStart = startOfMonth(state.currentDate);
  const monthEnd = endOfMonth(state.currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate all days for the calendar grid
  const days: Date[] = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return filterAppointments(
      calendarData.appointments.filter((apt) => {
        const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
        const dayDate = format(date, 'yyyy-MM-dd');
        return aptDate === dayDate;
      }),
      state.filters
    );
  };

  // Handle day click - switch to day view for that date
  const handleDayClick = (date: Date) => {
    actions.setDate(date);
    actions.setView('day');
  };

  return (
    <div className="h-full overflow-auto bg-white p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, state.currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    bg-white p-2 min-h-[100px] cursor-pointer
                    hover:bg-gray-50 transition-colors
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                  `}
                >
                  {/* Date number */}
                  <div
                    className={`
                      text-sm font-semibold mb-1
                      ${isToday ? 'bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Appointment indicators */}
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1">
                      {/* Show first 3 appointments */}
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs truncate px-1 py-0.5 bg-primary-100 text-primary-800 rounded"
                        >
                          {format(new Date(`2000-01-01T${apt.start_time}`), 'h:mm a')} - {apt.client_name}
                        </div>
                      ))}

                      {/* Show count if more appointments */}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
