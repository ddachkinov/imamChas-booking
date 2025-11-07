import React, { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { bookingApi } from '@/services/booking.api';
import { TimeSlot } from '@/types/booking.types';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfToday,
  parseISO,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';

export const DateTimeSelectionStep: React.FC = () => {
  const { state, actions } = useBooking();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available dates for current month
  useEffect(() => {
    const loadAvailability = async () => {
      if (!state.serviceId) return;

      try {
        setLoadingDates(true);
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        const availability = await bookingApi.getAvailability(state.businessId, {
          serviceId: state.serviceId,
          staffId: state.staffId || undefined,
          locationId: state.locationId || undefined,
          startDate: start,
          endDate: end,
        });

        const dates = new Set(
          availability.days
            .filter((day) => day.has_availability)
            .map((day) => day.date)
        );
        setAvailableDates(dates);
      } catch (error) {
        console.error('Failed to load availability:', error);
      } finally {
        setLoadingDates(false);
      }
    };

    loadAvailability();
  }, [state.businessId, state.serviceId, state.staffId, state.locationId, currentMonth]);

  // Load time slots when date is selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!state.appointmentDate || !state.serviceId) return;

      try {
        setLoadingSlots(true);
        const slots = await bookingApi.getTimeSlots(state.businessId, {
          serviceId: state.serviceId,
          staffId: state.staffId || undefined,
          locationId: state.locationId || undefined,
          date: state.appointmentDate,
        });
        setTimeSlots(slots.slots);
      } catch (error) {
        console.error('Failed to load time slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadTimeSlots();
  }, [state.businessId, state.serviceId, state.staffId, state.locationId, state.appointmentDate]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.has(dateStr) && !isBefore(date, startOfToday());
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      actions.selectDate(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleTimeSelect = (time: string) => {
    actions.selectTime(time);
    actions.nextStep();
  };

  // Group time slots by time of day
  const morningSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 6 && hour < 12 && slot.available;
  });

  const afternoonSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 12 && hour < 17 && slot.available;
  });

  const eveningSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 17 && hour < 21 && slot.available;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {days.map((day, dayIdx) => {
              const isAvailable = isDateAvailable(day);
              const isSelected =
                state.appointmentDate === format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateSelect(day)}
                  disabled={!isAvailable}
                  className={`
                    aspect-square p-2 text-sm rounded-lg transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isAvailable ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
                    ${isTodayDate && !isSelected ? 'border-2 border-blue-600' : ''}
                    ${!isSelected && isAvailable ? 'font-semibold text-gray-900' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {loadingDates && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Loading availability...
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Available Times
          </h3>

          {!state.appointmentDate ? (
            <p className="text-gray-500 text-center py-8">
              Please select a date to view available times
            </p>
          ) : loadingSlots ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : timeSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No availability on this date. Please choose another date.
            </p>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {morningSlots.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Morning (6 AM - 12 PM)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className="py-2 px-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm font-medium"
                      >
                        {format(parseISO(`2000-01-01T${slot.time}`), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Afternoon (12 PM - 5 PM)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className="py-2 px-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm font-medium"
                      >
                        {format(parseISO(`2000-01-01T${slot.time}`), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {eveningSlots.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Evening (5 PM - 9 PM)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {eveningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className="py-2 px-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm font-medium"
                      >
                        {format(parseISO(`2000-01-01T${slot.time}`), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {state.business?.timezone && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              All times in {state.business.timezone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
