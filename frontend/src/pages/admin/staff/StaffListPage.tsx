import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { staffApi } from '@/services/admin.api';
import { StaffMember, StaffFilters } from '@/types/admin.types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { PlusIcon, PencilIcon, TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { StaffInviteModal } from './StaffInviteModal';

export const StaffListPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Filters
  const [filters, setFilters] = useState<StaffFilters>({});

  // Fetch staff members
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', user?.business_id, filters],
    queryFn: () => staffApi.getStaffMembers(user!.business_id, filters),
    enabled: !!user?.business_id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', user?.business_id] });
      toast.success('Staff member removed successfully');
      setStaffToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to remove staff member', error.message);
    },
  });

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
  };

  const handleDelete = (staff: StaffMember) => {
    setStaffToDelete(staff);
  };

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

  const columns = [
    {
      key: 'staff',
      label: 'Staff Member',
      render: (staffMember: StaffMember) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={staffMember.user.avatar_url}
            name={`${staffMember.user.first_name} ${staffMember.user.last_name}`}
            size="md"
          />
          <div>
            <div className="font-medium text-gray-900">
              {staffMember.user.first_name} {staffMember.user.last_name}
            </div>
            <div className="text-sm text-gray-500">{staffMember.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (staffMember: StaffMember) => (
        <Badge variant={getRoleBadgeVariant(staffMember.role)}>
          {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (staffMember: StaffMember) => (
        <span className="text-sm text-gray-900">
          {staffMember.user.phone || 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (staffMember: StaffMember) => (
        <Badge variant={getStatusBadgeVariant(staffMember.status)}>
          {staffMember.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'stats',
      label: 'Appointments',
      render: (staffMember: StaffMember) => (
        <div className="text-sm">
          <div className="text-gray-900 font-medium">
            {staffMember.stats?.upcoming_appointments || 0} upcoming
          </div>
          <div className="text-gray-500">
            {staffMember.stats?.completed_appointments || 0} completed
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (staffMember: StaffMember) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(staffMember)}
            className="text-gray-600 hover:text-gray-900"
            title="Edit staff member"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {staffMember.role !== 'owner' && (
            <button
              onClick={() => handleDelete(staffMember)}
              className="text-red-600 hover:text-red-800"
              title="Remove staff member"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Members</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your team members and permissions</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <EnvelopeIcon className="h-5 w-5" />
            Invite Staff Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            value={filters.role || ''}
            onChange={(e) => setFilters({ ...filters, role: e.target.value as any || undefined })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'staff', label: 'Staff' },
              { value: 'receptionist', label: 'Receptionist' },
            ]}
            id="role-filter"
            label="Role"
          />
          <Select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'on_leave', label: 'On Leave' },
            ]}
            id="status-filter"
            label="Status"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          data={staff?.data || []}
          columns={columns}
          keyExtractor={(staffMember) => staffMember.id}
          emptyMessage="No staff members found. Invite your first team member to get started."
          isLoading={isLoading}
        />
      </div>

      {/* Invite Modal */}
      <StaffInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        businessId={user?.business_id || ''}
      />

      {/* Edit Modal (TODO: Implement edit functionality) */}
      {selectedStaff && (
        <div>
          {/* TODO: Implement edit modal */}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={() => staffToDelete && deleteMutation.mutate(staffToDelete.id)}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${staffToDelete?.user.first_name} ${staffToDelete?.user.last_name}? This will remove them from future scheduling but preserve historical data.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
};
