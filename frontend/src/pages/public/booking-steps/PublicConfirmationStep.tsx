import React from 'react';
import { BookingData } from '../PublicBookingWizard';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface PublicConfirmationStepProps {
  bookingData: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onBack: () => void;
  onComplete: () => void;
}

export const PublicConfirmationStep: React.FC<PublicConfirmationStepProps> = ({
  bookingData,
  onBack,
  onComplete,
}) => {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <CheckCircleIcon className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Your Booking
        </h2>
        <p className="text-gray-600">
          Please review the details before confirming
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Service</span>
          <span className="text-gray-900">Women's Haircut</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Staff</span>
          <span className="text-gray-900">Maria Ivanova</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Date</span>
          <span className="text-gray-900">{bookingData.date}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Time</span>
          <span className="text-gray-900">{bookingData.time}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Duration</span>
          <span className="text-gray-900">1 hour</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Name</span>
          <span className="text-gray-900">{bookingData.customerName}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Email</span>
          <span className="text-gray-900">{bookingData.customerEmail}</span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700">Phone</span>
          <span className="text-gray-900">{bookingData.customerPhone}</span>
        </div>

        {bookingData.notes && (
          <div className="py-3">
            <span className="font-medium text-gray-700 block mb-2">Notes</span>
            <span className="text-gray-900">{bookingData.notes}</span>
          </div>
        )}

        <div className="flex justify-between py-4 bg-white rounded-lg px-4 mt-4">
          <span className="font-semibold text-lg text-gray-900">Total Price</span>
          <span className="font-bold text-2xl text-primary-600">45.00 лв</span>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
        <h4 className="font-semibold text-warning-900 mb-2">Cancellation Policy</h4>
        <p className="text-sm text-warning-800">
          Free cancellation up to 24 hours before appointment. Late cancellations may incur a fee.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
};
