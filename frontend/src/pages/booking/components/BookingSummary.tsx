import React from 'react';
import { format } from 'date-fns';
import { useBooking } from '@/contexts/BookingContext';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const BookingSummary: React.FC = () => {
  const { state } = useBooking();
  const { service, staff, location, appointmentDate, appointmentTime } = state;

  if (!service) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

      <div className="space-y-4">
        {/* Service */}
        <div className="flex items-start gap-3">
          <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-medium text-gray-900 truncate">{service.name}</p>
            <p className="text-sm text-gray-600">
              {service.duration_minutes} min • ${service.price}
            </p>
          </div>
        </div>

        {/* Staff */}
        {staff && (
          <div className="flex items-start gap-3">
            <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Staff Member</p>
              <p className="font-medium text-gray-900">
                {staff.first_name} {staff.last_name}
              </p>
              {staff.title && <p className="text-sm text-gray-600">{staff.title}</p>}
            </div>
          </div>
        )}

        {/* Date */}
        {appointmentDate && (
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {format(new Date(appointmentDate), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        )}

        {/* Time */}
        {appointmentTime && (
          <div className="flex items-start gap-3">
            <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium text-gray-900">
                {format(new Date(`2000-01-01T${appointmentTime}`), 'h:mm a')}
              </p>
            </div>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{location.name}</p>
              <p className="text-sm text-gray-600">
                {location.address.street}, {location.address.city}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            ${service.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
