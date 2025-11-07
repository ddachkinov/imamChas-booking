import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { BookingStep } from '@/types/booking.types';

interface Step {
  number: number;
  name: string;
  shortName: string;
}

const steps: Step[] = [
  { number: BookingStep.SERVICE_SELECTION, name: 'Service', shortName: '1' },
  { number: BookingStep.STAFF_SELECTION, name: 'Staff', shortName: '2' },
  { number: BookingStep.DATE_TIME_SELECTION, name: 'Date & Time', shortName: '3' },
  { number: BookingStep.CLIENT_DETAILS, name: 'Details', shortName: '4' },
  { number: BookingStep.CONFIRMATION, name: 'Confirmation', shortName: '5' },
];

interface ProgressIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  allowStaffSelection: boolean;
  onStepClick?: (step: number) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  completedSteps,
  allowStaffSelection,
  onStepClick,
}) => {
  const visibleSteps = allowStaffSelection
    ? steps
    : steps.filter((s) => s.number !== BookingStep.STAFF_SELECTION);

  const getStepStatus = (stepNumber: number): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (currentStep === stepNumber) return 'current';
    return 'upcoming';
  };

  const isClickable = (stepNumber: number): boolean => {
    return completedSteps.includes(stepNumber) || stepNumber < currentStep;
  };

  return (
    <nav aria-label="Progress">
      {/* Desktop progress indicator */}
      <ol className="hidden md:flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(step.number);
          const clickable = isClickable(step.number);

          return (
            <li key={step.number} className="relative flex-1">
              {index !== 0 && (
                <div className="absolute top-5 left-0 right-0 -ml-px h-0.5 bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      status === 'completed' || status === 'current'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                    style={{
                      width: status === 'completed' ? '100%' : status === 'current' ? '50%' : '0%',
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => clickable && onStepClick && onStepClick(step.number)}
                disabled={!clickable}
                className={`relative flex flex-col items-center group ${
                  clickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    status === 'completed'
                      ? 'bg-blue-600 border-blue-600'
                      : status === 'current'
                      ? 'bg-white border-blue-600'
                      : 'bg-white border-gray-300'
                  } ${clickable && status !== 'current' ? 'group-hover:border-blue-500' : ''}`}
                >
                  {status === 'completed' ? (
                    <CheckIcon className="w-6 h-6 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        status === 'current' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.number}
                    </span>
                  )}
                </span>
                <span
                  className={`mt-2 text-sm font-medium ${
                    status === 'current' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile progress indicator */}
      <ol className="flex md:hidden items-center justify-between px-4">
        {visibleSteps.map((step) => {
          const status = getStepStatus(step.number);

          return (
            <li key={step.number} className="flex items-center">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  status === 'completed'
                    ? 'bg-blue-600 border-blue-600'
                    : status === 'current'
                    ? 'bg-white border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {status === 'completed' ? (
                  <CheckIcon className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      status === 'current' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
