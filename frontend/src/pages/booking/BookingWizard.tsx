import React, { useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { ProgressIndicator } from './components/ProgressIndicator';
import { BookingSummary } from './components/BookingSummary';
import { ServiceSelectionStep } from './steps/ServiceSelectionStep';
import { StaffSelectionStep } from './steps/StaffSelectionStep';
import { DateTimeSelectionStep } from './steps/DateTimeSelectionStep';
import { ClientDetailsStep } from './steps/ClientDetailsStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { BookingStep } from '@/types/booking.types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const BookingWizard: React.FC = () => {
  const { state, actions, error } = useBooking();
  const { currentStep, business } = state;

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case BookingStep.SERVICE_SELECTION:
        return <ServiceSelectionStep />;
      case BookingStep.STAFF_SELECTION:
        return <StaffSelectionStep />;
      case BookingStep.DATE_TIME_SELECTION:
        return <DateTimeSelectionStep />;
      case BookingStep.CLIENT_DETAILS:
        return <ClientDetailsStep />;
      case BookingStep.CONFIRMATION:
        return <ConfirmationStep />;
      default:
        return <ServiceSelectionStep />;
    }
  };

  const canGoBack = currentStep > BookingStep.SERVICE_SELECTION && currentStep < BookingStep.CONFIRMATION;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Business Header */}
      {business && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              {business.logo_url && (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="h-12 w-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                {business.tagline && (
                  <p className="text-sm text-gray-600">{business.tagline}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={currentStep}
            completedSteps={state.completedSteps}
            allowStaffSelection={business?.settings.allow_staff_selection || false}
            onStepClick={actions.goToStep}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Step Content */}
          <div className="lg:col-span-2">
            {/* Back Button */}
            {canGoBack && (
              <button
                onClick={actions.previousStep}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Current Step */}
            {renderStep()}
          </div>

          {/* Booking Summary (Desktop) */}
          <div className="hidden lg:block">
            <BookingSummary />
          </div>
        </div>

        {/* Booking Summary (Mobile - Expandable) */}
        <div className="lg:hidden mt-8">
          <BookingSummary />
        </div>
      </div>
    </div>
  );
};
