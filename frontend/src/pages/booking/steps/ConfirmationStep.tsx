import React, { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { bookingApi } from '@/services/booking.api';
import {
  CheckCircleIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';

export const ConfirmationStep: React.FC = () => {
  const { state, actions } = useBooking();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const appointment = state.confirmedAppointment;

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No appointment confirmed</p>
      </div>
    );
  }

  const handleResendEmail = async () => {
    try {
      setResending(true);
      await bookingApi.resendConfirmation(appointment.id);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (error) {
      console.error('Failed to resend confirmation:', error);
    } finally {
      setResending(false);
    }
  };

  const handleDownloadICS = () => {
    const url = bookingApi.getIcsUrl(appointment.id);
    window.open(url, '_blank');
  };

  const handleAddToGoogle = () => {
    const url = bookingApi.getGoogleCalendarUrl({
      service_name: appointment.service_name,
      date: appointment.date,
      time: appointment.time,
      location_name: appointment.location_name,
      location_address: appointment.location_address,
    });
    window.open(url, '_blank');
  };

  const formattedDate = format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(parseISO(`2000-01-01T${appointment.time}`), 'h:mm a');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your Appointment is Booked!
        </h2>
        <p className="text-gray-600">
          Confirmation #{appointment.appointment_number}
        </p>
      </div>

      {/* Appointment Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium text-gray-900">{appointment.service_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium text-gray-900">{formattedDate}</p>
              <p className="text-gray-600">{formattedTime}</p>
            </div>
          </div>

          {appointment.staff_name && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Staff Member</p>
                <p className="font-medium text-gray-900">{appointment.staff_name}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{appointment.location_name}</p>
              <p className="text-gray-600">{appointment.location_address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Email */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <EnvelopeIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              A confirmation email has been sent to{' '}
              <span className="font-medium">{appointment.client_email}</span>
            </p>
            {!resent && (
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {resending ? 'Resending...' : 'Resend confirmation email'}
              </button>
            )}
            {resent && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                Confirmation email resent!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add to Calendar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Calendar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleAddToGoogle}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Google Calendar</span>
          </button>
          <button
            onClick={handleDownloadICS}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Download (.ics)</span>
          </button>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <p className="text-gray-700">
              Check your email for the confirmation and appointment details
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <p className="text-gray-700">Arrive 10 minutes early for your appointment</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </span>
            <p className="text-gray-700">
              If you need to reschedule or cancel, please contact us at least{' '}
              {state.business?.settings.cancellation_hours || 24} hours in advance
            </p>
          </li>
        </ul>
      </div>

      {/* Contact Info */}
      {state.business && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
          <div className="space-y-2">
            {state.business.phone && (
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span> {state.business.phone}
              </p>
            )}
            {state.business.email && (
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> {state.business.email}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => actions.resetBooking()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Book Another Appointment
        </button>
        {state.business?.website && (
          <a
            href={state.business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            Go to Business Website
          </a>
        )}
      </div>
    </div>
  );
};
