import React, { useState } from 'react';
import { BookingData } from '../PublicBookingWizard';
import { StaffCard } from '@/components/public/StaffCard';

interface PublicStaffStepProps {
  bookingData: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const STAFF = [
  {
    id: 'no-preference',
    name: 'No Preference',
    role: 'First available',
    bio: 'We\'ll assign the first available staff member for your appointment',
    photoUrl: undefined,
  },
  {
    id: '1',
    name: 'Maria Ivanova',
    role: 'Senior Hair Stylist',
    bio: '10+ years of experience in hair styling and coloring',
    photoUrl: undefined,
    rating: 4.9,
    reviewCount: 87,
    specialties: ['Hair Coloring', 'Balayage', 'Women\'s Cuts'],
  },
  {
    id: '2',
    name: 'Elena Petrova',
    role: 'Nail Technician',
    bio: 'Specialized in nail art and gel manicures',
    photoUrl: undefined,
    rating: 4.8,
    reviewCount: 56,
    specialties: ['Gel Manicure', 'Nail Art', 'Extensions'],
  },
];

export const PublicStaffStep: React.FC<PublicStaffStepProps> = ({
  bookingData,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [selectedStaff, setSelectedStaff] = useState(bookingData.staffId || 'no-preference');

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff(staffId);
    onUpdate({ staffId });
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Choose Staff Member
      </h2>
      <p className="text-gray-600 mb-6">
        Select your preferred staff member or let us assign the next available
      </p>

      <div className="space-y-4 mb-8">
        {STAFF.map((staff) => (
          <StaffCard
            key={staff.id}
            {...staff}
            onSelect={() => handleSelectStaff(staff.id)}
            isSelected={selectedStaff === staff.id}
          />
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
