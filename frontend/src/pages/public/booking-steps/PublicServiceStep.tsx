import React, { useState } from 'react';
import { BookingData } from '../PublicBookingWizard';
import { ServiceCard } from '@/components/public/ServiceCard';

interface PublicServiceStepProps {
  bookingData: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock services
const SERVICES = [
  {
    id: '1',
    name: 'Women\'s Haircut',
    description: 'Professional haircut with styling consultation',
    price: 45,
    duration: 60,
    category: 'Hair Services',
  },
  {
    id: '2',
    name: 'Hair Coloring',
    description: 'Full hair coloring with premium products',
    price: 80,
    duration: 120,
    category: 'Hair Services',
  },
  {
    id: '3',
    name: 'Manicure',
    description: 'Classic manicure with nail polish',
    price: 25,
    duration: 45,
    category: 'Nail Services',
  },
  {
    id: '4',
    name: 'Gel Manicure',
    description: 'Long-lasting gel nail polish',
    price: 35,
    duration: 60,
    category: 'Nail Services',
  },
];

export const PublicServiceStep: React.FC<PublicServiceStepProps> = ({
  bookingData,
  onUpdate,
  onNext,
}) => {
  const [selectedService, setSelectedService] = useState(bookingData.serviceId);

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    onUpdate({ serviceId });
  };

  const handleNext = () => {
    if (selectedService) {
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Choose a Service
      </h2>
      <p className="text-gray-600 mb-6">
        Select the service you'd like to book
      </p>

      <div className="space-y-4 mb-8">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            onClick={() => handleSelectService(service.id)}
            className={`cursor-pointer transition-all ${
              selectedService === service.id ? 'ring-2 ring-primary-500 rounded-lg' : ''
            }`}
          >
            <ServiceCard {...service} showBookButton={false} />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedService}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
