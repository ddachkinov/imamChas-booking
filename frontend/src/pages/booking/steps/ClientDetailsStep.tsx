import React, { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { bookingApi } from '@/services/booking.api';

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  notes: z.string().optional(),
  sms_opt_in: z.boolean(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientDetailsStep: React.FC = () => {
  const { state, actions, isLoading } = useBooking();
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: state.clientInfo.first_name || '',
      last_name: state.clientInfo.last_name || '',
      email: state.clientInfo.email || '',
      phone: state.clientInfo.phone || '',
      notes: state.clientInfo.notes || '',
      sms_opt_in: state.clientInfo.sms_opt_in ?? true,
      accept_terms: state.clientInfo.accept_terms ?? false,
    },
  });

  const email = watch('email');

  // Check if returning customer
  useEffect(() => {
    const checkCustomer = async () => {
      if (email && email.includes('@')) {
        try {
          const result = await bookingApi.checkReturningCustomer(state.businessId, email);
          if (result.is_returning) {
            setIsReturningCustomer(true);
            if (result.first_name) setValue('first_name', result.first_name);
            if (result.last_name) setValue('last_name', result.last_name);
            if (result.phone) setValue('phone', result.phone);
          }
        } catch (error) {
          console.error('Failed to check customer:', error);
        }
      }
    };

    const timer = setTimeout(checkCustomer, 500);
    return () => clearTimeout(timer);
  }, [email, state.businessId, setValue]);

  const onSubmit = async (data: ClientFormData) => {
    // Update context with client info
    actions.updateClientInfo(data);

    // Create appointment
    await actions.confirmBooking();
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>

      {isReturningCustomer && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Welcome back, {watch('first_name')}! We've pre-filled your information.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="First Name"
            {...register('first_name')}
            error={errors.first_name?.message}
            required
          />
          <Input
            label="Last Name"
            {...register('last_name')}
            error={errors.last_name?.message}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
          />
          <Input
            label="Phone"
            type="tel"
            {...register('phone', {
              onChange: (e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setValue('phone', formatted);
              },
            })}
            error={errors.phone?.message}
            placeholder="(555) 555-5555"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests or Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special requests or information we should know?"
          />
          <p className="mt-1 text-xs text-gray-500">
            {watch('notes')?.length || 0} / 500 characters
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('sms_opt_in')}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Send me appointment reminders via SMS
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('accept_terms')}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-blue-600 hover:underline"
              >
                cancellation policy and terms of service
              </button>
            </span>
          </label>
          {errors.accept_terms && (
            <p className="text-sm text-red-600">{errors.accept_terms.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>

      {/* Cancellation Policy Modal */}
      {showPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancellation Policy & Terms
            </h3>
            <div className="prose prose-sm">
              <p>
                To cancel or reschedule your appointment, please contact us at least{' '}
                {state.business?.settings.cancellation_hours || 24} hours in advance.
              </p>
              <p>
                Cancellations made with less than{' '}
                {state.business?.settings.cancellation_hours || 24} hours notice may be
                subject to a cancellation fee.
              </p>
              <p>
                By booking this appointment, you agree to arrive on time and provide
                accurate contact information.
              </p>
            </div>
            <button
              onClick={() => setShowPolicy(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
