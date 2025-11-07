import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { businessApi } from '@/services/admin.api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { BusinessType } from '@/types/admin.types';

const businessSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  business_type: z.nativeEnum(BusinessType),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional().or(z.literal('')),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export const BusinessProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', user?.business_id],
    queryFn: () => businessApi.getBusiness(user!.business_id),
    enabled: !!user?.business_id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    values: business?.data || undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: BusinessFormData) =>
      businessApi.updateBusiness(user!.business_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', user?.business_id] });
      toast.success('Business profile updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update business profile', error.message);
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your business information and settings</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              {...register('name')}
              id="name"
              label="Business Name"
              error={errors.name?.message}
              required
            />

            <Select
              {...register('business_type')}
              id="business_type"
              label="Business Type"
              error={errors.business_type?.message}
              options={Object.values(BusinessType).map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              }))}
              required
            />

            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email"
              error={errors.email?.message}
              required
            />

            <Input
              {...register('phone')}
              id="phone"
              type="tel"
              label="Phone"
              error={errors.phone?.message}
            />

            <Input
              {...register('website')}
              id="website"
              type="url"
              label="Website"
              error={errors.website?.message}
            />

            <Input
              {...register('timezone')}
              id="timezone"
              label="Timezone"
              error={errors.timezone?.message}
              placeholder="America/New_York"
              required
            />

            <Input
              {...register('primary_color')}
              id="primary_color"
              type="color"
              label="Primary Brand Color"
              error={errors.primary_color?.message}
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Tell us about your business..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
