import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { calendarApi } from '@/services/calendar.api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import type { QuickCreateFormData } from '@/types/calendar.types';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  defaultDate?: string;
  defaultTime?: string;
}

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  service_id: z.string().min(1, 'Service is required'),
  staff_id: z.string().min(1, 'Staff is required'),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Time is required'),
  notes: z.string().optional(),
});

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  businessId,
  defaultDate,
  defaultTime,
}) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [clientSearch, setClientSearch] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<QuickCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: defaultDate || new Date().toISOString().split('T')[0],
      start_time: defaultTime || '09:00',
    },
  });

  const serviceId = watch('service_id');

  // Fetch clients for search
  const { data: clients } = useQuery({
    queryKey: ['clients', businessId, clientSearch],
    queryFn: () => calendarApi.searchClients({ businessId, query: clientSearch || 'a', limit: 50 }),
    enabled: !!businessId && clientSearch.length > 0,
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['services', businessId],
    queryFn: () => calendarApi.getServices({ businessId }),
    enabled: !!businessId,
  });

  // Fetch staff (filtered by selected service)
  const { data: staff, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ['staff', businessId, serviceId],
    queryFn: () => calendarApi.getStaff({ businessId, serviceId }),
    enabled: !!businessId,
  });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: QuickCreateFormData) => calendarApi.quickCreateAppointment(data),
    onSuccess: () => {
      success('Appointment created successfully');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      reset();
      onClose();
    },
    onError: () => {
      showError('Failed to create appointment');
    },
  });

  const onSubmit = (data: QuickCreateFormData) => {
    createMutation.mutate(data);
  };

  // Show loading or error states
  if (servicesLoading || staffLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Quick Create Appointment">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </Modal>
    );
  }

  if (servicesError || staffError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Quick Create Appointment">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Failed to load required data</p>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </Modal>
    );
  }

  // Check if we have required data
  const hasServices = services && Array.isArray(services) && services.length > 0;
  const hasStaff = staff && Array.isArray(staff) && staff.length > 0;

  if (!hasServices || !hasStaff) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Quick Create Appointment">
        <div className="text-center py-8">
          <p className="text-amber-600 mb-4">
            {!hasServices && 'No services available. Please create a service first.'}
            {hasServices && !hasStaff && 'No staff members available. Please add staff members first.'}
          </p>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Create Appointment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Client Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Search client by name..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm mb-2"
          />
          <select
            {...register('client_id')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select a client</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name} - {client.email}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
          )}
        </div>

        {/* Service */}
        <Select
          label="Service *"
          error={errors.service_id?.message}
          {...register('service_id')}
        >
          <option value="">Select a service</option>
          {services?.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min - ${service.price})
            </option>
          ))}
        </Select>

        {/* Staff */}
        <Select
          label="Staff *"
          error={errors.staff_id?.message}
          {...register('staff_id')}
        >
          <option value="">Select staff</option>
          {staff?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date *"
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            type="time"
            label="Start Time *"
            error={errors.start_time?.message}
            {...register('start_time')}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Optional notes about the appointment..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
