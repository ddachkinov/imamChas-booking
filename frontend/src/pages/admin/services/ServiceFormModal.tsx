import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/admin.api';
import { Service, CreateServiceDto } from '@/types/admin.types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const SERVICE_CATEGORIES = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'coloring', label: 'Coloring' },
  { value: 'styling', label: 'Styling' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'massage', label: 'Massage' },
  { value: 'facial', label: 'Facial' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'other', label: 'Other' },
];

const serviceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  duration_minutes: z.coerce
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours')
    .refine((val) => val % 15 === 0, 'Duration must be in 15-minute increments'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  buffer_before_minutes: z.coerce.number().min(0).max(60).optional(),
  buffer_after_minutes: z.coerce.number().min(0).max(60).optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  service?: Service;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  businessId,
  service,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    values: service
      ? {
          name: service.name,
          description: service.description || '',
          duration_minutes: service.duration_minutes,
          price: service.price,
          category: service.category,
          buffer_before_minutes: service.buffer_before_minutes || 0,
          buffer_after_minutes: service.buffer_after_minutes || 0,
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceDto) => serviceApi.createService(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      toast.success('Service created successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to create service', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateServiceDto>) =>
      serviceApi.updateService(service!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', businessId] });
      toast.success('Service updated successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to update service', error.message);
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    const serviceDto: CreateServiceDto = {
      name: data.name,
      description: data.description || undefined,
      duration_minutes: data.duration_minutes,
      price: data.price,
      category: data.category,
      buffer_before_minutes: data.buffer_before_minutes || 0,
      buffer_after_minutes: data.buffer_after_minutes || 0,
    };

    if (service) {
      updateMutation.mutate(serviceDto);
    } else {
      createMutation.mutate(serviceDto);
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
      title={service ? 'Edit Service' : 'Add New Service'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('name')}
          id="name"
          label="Service Name"
          error={errors.name?.message}
          placeholder="e.g., Haircut & Style"
          required
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Describe what this service includes..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('duration_minutes')}
            id="duration_minutes"
            type="number"
            label="Duration (minutes)"
            error={errors.duration_minutes?.message}
            placeholder="60"
            helperText="Must be in 15-minute increments (15, 30, 45, 60, etc.)"
            required
          />

          <Input
            {...register('price')}
            id="price"
            type="number"
            step="0.01"
            label="Price ($)"
            error={errors.price?.message}
            placeholder="50.00"
            required
          />
        </div>

        <Select
          {...register('category')}
          id="category"
          label="Category"
          error={errors.category?.message}
          options={SERVICE_CATEGORIES}
          required
        />

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Buffer Times</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('buffer_before_minutes')}
              id="buffer_before_minutes"
              type="number"
              label="Buffer Before (minutes)"
              error={errors.buffer_before_minutes?.message}
              placeholder="0"
              helperText="Setup time before appointment"
            />

            <Input
              {...register('buffer_after_minutes')}
              id="buffer_after_minutes"
              type="number"
              label="Buffer After (minutes)"
              error={errors.buffer_after_minutes?.message}
              placeholder="0"
              helperText="Cleanup time after appointment"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {service ? 'Update' : 'Create'} Service
          </Button>
        </div>
      </form>
    </Modal>
  );
};
