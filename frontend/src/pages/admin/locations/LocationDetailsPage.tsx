import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { locationApi } from '@/services/admin.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LocationDetailsPage = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();

  // Fetch location details
  const { data: location, isLoading } = useQuery({
    queryKey: ['location', locationId],
    queryFn: () => locationApi.getLocation(locationId!),
    enabled: !!locationId,
  });

  if (isLoading || !location) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const locationData = location.data;

  // Format time from HH:mm to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Sort business hours by day
  const sortedBusinessHours = [...locationData.business_hours].sort(
    (a, b) => a.day_of_week - b.day_of_week
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/locations')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Locations
        </Button>
      </div>

      {/* Location Details Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{locationData.name}</h1>
                <Badge variant={locationData.is_active ? 'success' : 'neutral'}>
                  {locationData.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {locationData.is_primary && <Badge variant="info">Primary</Badge>}
              </div>
              <div className="mt-2 flex items-start gap-2 text-gray-600">
                <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{locationData.address.street}</p>
                  <p>
                    {locationData.address.city}, {locationData.address.state}{' '}
                    {locationData.address.postal_code}
                  </p>
                  <p>{locationData.address.country}</p>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/locations')}>Edit Location</Button>
          </div>

          {/* Contact Information */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
                <PhoneIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-lg font-semibold text-gray-900">{locationData.phone}</p>
              </div>
            </div>

            {locationData.email && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
                  <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{locationData.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Timezone</p>
                <p className="text-lg font-semibold text-gray-900">{locationData.timezone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h2>
        <div className="space-y-3">
          {sortedBusinessHours.map((hours) => (
            <div
              key={hours.day_of_week}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium text-gray-900">
                {DAYS_OF_WEEK[hours.day_of_week]}
              </span>
              {hours.is_open ? (
                <span className="text-gray-600">
                  {formatTime(hours.open_time!)} - {formatTime(hours.close_time!)}
                </span>
              ) : (
                <span className="text-gray-500 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Statistics</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-blue-100 p-3">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Total Appointments</p>
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
            <p className="text-2xl font-semibold text-gray-900">-</p>
            <p className="text-xs text-gray-500 mt-1">Staff assignments available after integration</p>
          </div>
        </div>
      </div>

      {/* Assigned Staff Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Staff</h2>
        <p className="text-sm text-gray-500">
          Staff assignments will be displayed here once staff members are assigned to this location.
        </p>
      </div>

      {/* Available Services Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Services</h2>
        <p className="text-sm text-gray-500">
          Services available at this location will be displayed here once services are assigned.
        </p>
      </div>
    </div>
  );
};
