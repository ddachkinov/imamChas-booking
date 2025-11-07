import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from '@/services/admin.api';
import { Location, CreateLocationDto } from '@/types/admin.types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  location?: Location;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  businessId,
  location,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    values: location
      ? {
          name: location.name,
          street: location.address.street,
          city: location.address.city,
          state: location.address.state,
          postal_code: location.address.postal_code,
          country: location.address.country,
          phone: location.phone,
          email: location.email || '',
          timezone: location.timezone,
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLocationDto) => locationApi.createLocation(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', businessId] });
      toast.success('Location created successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to create location', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateLocationDto>) =>
      locationApi.updateLocation(location!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', businessId] });
      toast.success('Location updated successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to update location', error.message);
    },
  });

  const onSubmit = (data: LocationFormData) => {
    const locationDto: CreateLocationDto = {
      name: data.name,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
      },
      phone: data.phone,
      email: data.email || undefined,
      timezone: data.timezone,
      business_hours: [
        { day_of_week: 0, is_open: false }, // Sunday
        { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '17:00' }, // Monday
        { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '17:00' },
        { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '17:00' },
        { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '17:00' },
        { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '17:00' }, // Friday
        { day_of_week: 6, is_open: false }, // Saturday
      ],
    };

    if (location) {
      updateMutation.mutate(locationDto);
    } else {
      createMutation.mutate(locationDto);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={location ? 'Edit Location' : 'Add New Location'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('name')}
          id="name"
          label="Location Name"
          error={errors.name?.message}
          placeholder="e.g., Downtown Office"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              {...register('street')}
              id="street"
              label="Street Address"
              error={errors.street?.message}
              placeholder="123 Main St"
              required
            />
          </div>

          <Input
            {...register('city')}
            id="city"
            label="City"
            error={errors.city?.message}
            placeholder="New York"
            required
          />

          <Input
            {...register('state')}
            id="state"
            label="State/Province"
            error={errors.state?.message}
            placeholder="NY"
            required
          />

          <Input
            {...register('postal_code')}
            id="postal_code"
            label="Postal Code"
            error={errors.postal_code?.message}
            placeholder="10001"
            required
          />

          <Input
            {...register('country')}
            id="country"
            label="Country"
            error={errors.country?.message}
            placeholder="USA"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('phone')}
            id="phone"
            type="tel"
            label="Phone"
            error={errors.phone?.message}
            placeholder="+1 (555) 123-4567"
            required
          />

          <Input
            {...register('email')}
            id="email"
            type="email"
            label="Email"
            error={errors.email?.message}
            placeholder="location@example.com"
          />
        </div>

        <Input
          {...register('timezone')}
          id="timezone"
          label="Timezone"
          error={errors.timezone?.message}
          placeholder="America/New_York"
          helperText="IANA timezone identifier (e.g., America/New_York, Europe/London)"
          required
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {location ? 'Update' : 'Create'} Location
          </Button>
        </div>
      </form>
    </Modal>
  );
};
