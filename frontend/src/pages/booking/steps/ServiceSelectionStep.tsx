import React, { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { bookingApi } from '@/services/booking.api';
import { Service, ServiceCategory } from '@/types/booking.types';
import { ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export const ServiceSelectionStep: React.FC = () => {
  const { state, actions } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await bookingApi.getServices(
          state.businessId,
          state.locationId || undefined
        );
        setServices(data);

        // Extract categories
        const categoryMap = new Map<string, number>();
        data.forEach((service) => {
          const count = categoryMap.get(service.category) || 0;
          categoryMap.set(service.category, count + 1);
        });

        const cats: ServiceCategory[] = [
          { id: 'all', name: 'All Services', count: data.length },
          ...Array.from(categoryMap.entries()).map(([name, count]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            count,
          })),
        ];

        setCategories(cats);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    };

    if (state.businessId) {
      loadServices();
    }
  }, [state.businessId, state.locationId]);

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter(
          (s) => s.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory
        );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">
          No services available at this time. Please contact us directly.
        </p>
        {state.business?.phone && (
          <p className="mt-2 text-blue-600">{state.business.phone}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Service</h2>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-300`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => actions.selectService(service)}
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 ${
              state.serviceId === service.id ? 'border-blue-600' : 'border-transparent'
            }`}
          >
            {service.image_url && (
              <img
                src={service.image_url}
                alt={service.name}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}

            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              {service.is_popular && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                  Popular
                </span>
              )}
            </div>

            {service.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span>{service.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1 text-gray-900 font-semibold">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>${service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
