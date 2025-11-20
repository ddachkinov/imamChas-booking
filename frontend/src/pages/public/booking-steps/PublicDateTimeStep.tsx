import React, { useState } from 'react';
import { BookingData } from '../PublicBookingWizard';

interface PublicDateTimeStepProps {
  bookingData: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock time slots
const TIME_SLOTS = [
  '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00',
];

export const PublicDateTimeStep: React.FC<PublicDateTimeStepProps> = ({
  bookingData,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(bookingData.date || '');
  const [selectedTime, setSelectedTime] = useState(bookingData.time || '');

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    onUpdate({ date });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onUpdate({ time });
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onNext();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Choose Date & Time
      </h2>
      <p className="text-gray-600 mb-6">
        Select your preferred appointment date and time
      </p>

      {/* Date Picker */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Available Times
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {TIME_SLOTS.map((time) => {
              const isAvailable = Math.random() > 0.3; // Mock availability
              return (
                <button
                  key={time}
                  onClick={() => isAvailable && handleTimeSelect(time)}
                  disabled={!isAvailable}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    selectedTime === time
                      ? 'bg-primary-500 text-white ring-2 ring-primary-600'
                      : isAvailable
                      ? 'bg-white border-2 border-gray-200 hover:border-primary-300 text-gray-900'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedTime}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
