import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { XMarkIcon, UserIcon, ClockIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { calendarApi } from '@/services/calendar.api';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import type { AppointmentStatus } from '@/types/calendar.types';

interface AppointmentDetailSidebarProps {
  appointmentId: string;
  onClose: () => void;
}

export const AppointmentDetailSidebar: React.FC<AppointmentDetailSidebarProps> = ({
  appointmentId,
  onClose,
}) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointment details
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => calendarApi.getAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      calendarApi.updateAppointmentStatus({ appointment_id: appointmentId, status }),
    onSuccess: () => {
      success('Appointment status updated');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: () => {
      showError('Failed to update status');
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: () => calendarApi.cancelAppointment(appointmentId, 'Cancelled by staff', true),
    onSuccess: () => {
      success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onClose();
    },
    onError: () => {
      showError('Failed to cancel appointment');
    },
  });

  const handleStatusChange = (status: AppointmentStatus) => {
    statusMutation.mutate(status);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Appointment number */}
          <div>
            <p className="text-sm text-gray-500">Appointment #</p>
            <p className="font-mono text-sm font-medium">{appointment.appointment_number}</p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Status</p>
            <StatusBadge status={appointment.status} size="md" />
          </div>

          {/* Client info */}
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Client</span>
            </div>
            <div className="pl-7">
              <p className="font-medium text-gray-900">{appointment.client_name}</p>
              <p className="text-sm text-gray-600">{appointment.client_email}</p>
              <p className="text-sm text-gray-600">{appointment.client_phone}</p>
            </div>
          </div>

          {/* Service info */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Service</p>
            <p className="font-medium text-gray-900">{appointment.service_name}</p>
            <p className="text-sm text-gray-600">{appointment.service_duration} minutes</p>
          </div>

          {/* Date and time */}
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Date & Time</span>
            </div>
            <div className="pl-7">
              <p className="font-medium text-gray-900">
                {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-gray-600">
                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
              </p>
            </div>
          </div>

          {/* Staff member */}
          {appointment.staff_name && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Staff Member</p>
              <p className="font-medium text-gray-900">{appointment.staff_name}</p>
            </div>
          )}

          {/* Location */}
          {appointment.location_name && (
            <div>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span className="font-medium">Location</span>
              </div>
              <div className="pl-7">
                <p className="font-medium text-gray-900">{appointment.location_name}</p>
              </div>
            </div>
          )}

          {/* Price */}
          <div>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Price</span>
            </div>
            <div className="pl-7">
              <p className="text-2xl font-bold text-gray-900">${appointment.price.toFixed(2)}</p>
              {appointment.payment_status && (
                <p className="text-sm text-gray-600 capitalize">{appointment.payment_status}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-gray-900">{appointment.notes}</p>
            </div>
          )}

          {/* Internal notes */}
          {appointment.internal_notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Internal Notes (Staff Only)</p>
              <p className="text-gray-900">{appointment.internal_notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* Status actions */}
          {appointment.status === 'confirmed' && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleStatusChange('checked_in')}
              disabled={statusMutation.isPending}
            >
              Check In
            </Button>
          )}

          {appointment.status === 'checked_in' && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleStatusChange('in_progress')}
              disabled={statusMutation.isPending}
            >
              Start Service
            </Button>
          )}

          {appointment.status === 'in_progress' && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleStatusChange('completed')}
              disabled={statusMutation.isPending}
            >
              Mark Completed
            </Button>
          )}

          {/* Cancel button */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              Cancel Appointment
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
