import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/services/admin.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const StaffDetailsPage = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();

  // Fetch staff details
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff-member', staffId],
    queryFn: () => staffApi.getStaffMember(staffId!),
    enabled: !!staffId,
  });

  if (isLoading || !staff) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const staffData = staff.data;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'error' as const;
      case 'admin':
        return 'warning' as const;
      case 'staff':
        return 'info' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success' as const;
      case 'inactive':
        return 'neutral' as const;
      case 'on_leave':
        return 'warning' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatRoleName = (role: string) => {
    if (!role) return 'Staff';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatStatusName = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/staff')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Staff
        </Button>
      </div>

      {/* Staff Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={staffData.user.avatar_url}
              name={`${staffData.user.first_name} ${staffData.user.last_name}`}
              size="xl"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {staffData.user.first_name} {staffData.user.last_name}
              </h1>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">{staffData.user.email}</p>
                {staffData.user.phone && (
                  <p className="text-sm text-gray-600">{staffData.user.phone}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant={getRoleBadgeVariant(staffData.role)}>
                  {formatRoleName(staffData.role)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(staffData.status)}>
                  {formatStatusName(staffData.status)}
                </Badge>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/staff')}>Edit Staff Member</Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">
                {staffData.stats?.upcoming_appointments ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {staffData.stats?.completed_appointments ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${staffData.stats?.total_revenue?.toFixed(2) ?? '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {staffData.stats?.average_rating?.toFixed(1) ?? '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Services */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <WrenchScrewdriverIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Assigned Services</h2>
        </div>
        {staffData.service_ids && staffData.service_ids.length > 0 ? (
          <div>
            <p className="text-sm text-gray-600">
              This staff member can perform {staffData.service_ids.length} service
              {staffData.service_ids.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Service details will be displayed here once services module is integrated.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No services assigned yet. Assign services to allow this staff member to perform bookings.
          </p>
        )}
      </div>

      {/* Assigned Locations */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPinIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Assigned Locations</h2>
        </div>
        {staffData.location_ids && staffData.location_ids.length > 0 ? (
          <div>
            <p className="text-sm text-gray-600">
              This staff member works at {staffData.location_ids.length} location
              {staffData.location_ids.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Location details will be displayed here once locations module is integrated.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No locations assigned yet. Assign locations to specify where this staff member works.
          </p>
        )}
      </div>

      {/* Schedule & Availability */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Schedule & Availability</h2>
        </div>
        <p className="text-sm text-gray-500">
          Staff schedule and availability management will be displayed here once the scheduling module is
          integrated. This will include:
        </p>
        <ul className="mt-3 text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Regular working hours</li>
          <li>Time off and vacation days</li>
          <li>Break times</li>
          <li>Availability overrides</li>
        </ul>
      </div>

      {/* Permissions Section */}
      {staffData.permissions && staffData.permissions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h2>
          <div className="flex flex-wrap gap-2">
            {staffData.permissions.map((permission) => (
              <Badge key={permission} variant="neutral" size="sm">
                {permission.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-sm text-gray-500">
          Recent appointments and activity history will be displayed here once the appointments module is
          integrated.
        </p>
      </div>
    </div>
  );
};
