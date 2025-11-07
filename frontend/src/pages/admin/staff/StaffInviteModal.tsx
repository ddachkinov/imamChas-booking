import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/services/admin.api';
import { StaffRole, StaffInvitation } from '@/types/admin.types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(StaffRole),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface StaffInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export const StaffInviteModal: React.FC<StaffInviteModalProps> = ({
  isOpen,
  onClose,
  businessId,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: StaffRole.STAFF,
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: StaffInvitation) => staffApi.inviteStaff(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', businessId] });
      toast.success('Invitation sent successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to send invitation', error.message);
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Staff Member"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('email')}
          id="email"
          type="email"
          label="Email Address"
          error={errors.email?.message}
          placeholder="staff@example.com"
          helperText="An invitation email will be sent to this address"
          required
        />

        <Select
          {...register('role')}
          id="role"
          label="Role"
          error={errors.role?.message}
          options={[
            { value: StaffRole.ADMIN, label: 'Admin' },
            { value: StaffRole.STAFF, label: 'Staff' },
            { value: StaffRole.RECEPTIONIST, label: 'Receptionist' },
          ]}
          required
        />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Admin:</strong> Full access to all features except billing</li>
            <li><strong>Staff:</strong> Manage appointments, clients, and own schedule</li>
            <li><strong>Receptionist:</strong> Manage appointments and clients only</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={inviteMutation.isPending}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
