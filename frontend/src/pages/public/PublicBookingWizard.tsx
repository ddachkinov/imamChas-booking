import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Step components (simplified for now)
import { PublicServiceStep } from './booking-steps/PublicServiceStep';
import { PublicStaffStep } from './booking-steps/PublicStaffStep';
import { PublicDateTimeStep } from './booking-steps/PublicDateTimeStep';
import { PublicCustomerDetailsStep } from './booking-steps/PublicCustomerDetailsStep';
import { PublicConfirmationStep } from './booking-steps/PublicConfirmationStep';

export interface BookingData {
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

const STEPS = [
  { id: 1, name: 'Service', component: PublicServiceStep },
  { id: 2, name: 'Staff', component: PublicStaffStep },
  { id: 3, name: 'Date & Time', component: PublicDateTimeStep },
  { id: 4, name: 'Your Details', component: PublicCustomerDetailsStep },
  { id: 5, name: 'Confirm', component: PublicConfirmationStep },
];

export const PublicBookingWizard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service');

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: preselectedService || undefined,
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(`/studios/${slug}`);
    }
  };

  const handleUpdateData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const handleComplete = async () => {
    // TODO: Submit booking to API
    console.log('Booking data:', bookingData);
    navigate(`/booking/confirm/123`);
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
            <div className="text-lg font-semibold text-gray-900">
              Book Appointment
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                      currentStep >= step.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-12 md:w-20 h-1 mx-2 ${
                        currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Names */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    currentStep === step.id ? 'font-semibold text-primary-600' : ''
                  }`}
                >
                  {step.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <CurrentStepComponent
            bookingData={bookingData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
};
