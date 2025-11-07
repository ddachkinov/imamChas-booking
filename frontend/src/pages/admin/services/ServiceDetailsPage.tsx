import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '@/services/admin.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export const ServiceDetailsPage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  // Fetch service details
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => serviceApi.getService(serviceId!),
    enabled: !!serviceId,
  });

  if (isLoading || !service) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const serviceData = service.data;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/services')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Services
        </Button>
      </div>

      {/* Service Details Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{serviceData.name}</h1>
                <Badge variant={serviceData.is_active ? 'success' : 'neutral'}>
                  {serviceData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {serviceData.description && (
                <p className="mt-2 text-gray-600">{serviceData.description}</p>
              )}
            </div>
            <Button onClick={() => navigate(`/admin/services?edit=${serviceId}`)}>
              Edit Service
            </Button>
          </div>

          {/* Service Information Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${serviceData.price.toFixed(2)} {serviceData.currency}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(serviceData.duration_minutes)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                <TagIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {serviceData.category}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buffer Times */}
      {(serviceData.buffer_before_minutes > 0 || serviceData.buffer_after_minutes > 0) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Buffer Times</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Before Appointment</p>
              <p className="text-lg text-gray-900">
                {serviceData.buffer_before_minutes > 0
                  ? `${serviceData.buffer_before_minutes} minutes`
                  : 'None'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">After Appointment</p>
              <p className="text-lg text-gray-900">
                {serviceData.buffer_after_minutes > 0
                  ? `${serviceData.buffer_after_minutes} minutes`
                  : 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Restrictions */}
      {serviceData.booking_restrictions && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Restrictions</h2>
          <div className="space-y-3">
            {serviceData.booking_restrictions.min_advance_booking_minutes && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minimum Advance Booking</span>
                <span className="text-sm font-medium text-gray-900">
                  {serviceData.booking_restrictions.min_advance_booking_minutes} minutes
                </span>
              </div>
            )}
            {serviceData.booking_restrictions.max_advance_booking_days && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Maximum Advance Booking</span>
                <span className="text-sm font-medium text-gray-900">
                  {serviceData.booking_restrictions.max_advance_booking_days} days
                </span>
              </div>
            )}
            {serviceData.booking_restrictions.min_cancellation_notice_hours && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minimum Cancellation Notice</span>
                <span className="text-sm font-medium text-gray-900">
                  {serviceData.booking_restrictions.min_cancellation_notice_hours} hours
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Placeholder */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Statistics</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-blue-100 p-3">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-semibold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-1">Statistics available after integration</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-green-100 p-3">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-1">Statistics available after integration</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-purple-100 p-3">
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Assigned Staff</p>
            <p className="text-2xl font-semibold text-gray-900">
              {serviceData.staff_ids?.length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {serviceData.staff_ids?.length || 0} staff members can perform this service
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Locations */}
      {serviceData.location_ids && serviceData.location_ids.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available At</h2>
          <p className="text-sm text-gray-600">
            This service is available at {serviceData.location_ids.length} location
            {serviceData.location_ids.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};
