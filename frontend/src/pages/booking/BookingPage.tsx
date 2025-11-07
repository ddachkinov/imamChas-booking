import React from 'react';
import { useParams } from 'react-router-dom';
import { BookingProvider } from '@/contexts/BookingContext';
import { BookingWizard } from './BookingWizard';

export const BookingPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Booking Link</h1>
          <p className="text-gray-600">
            The booking link you're using is invalid. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BookingProvider businessId={businessId}>
      <BookingWizard />
    </BookingProvider>
  );
};
