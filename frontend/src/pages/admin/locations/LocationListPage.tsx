import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { locationApi } from '@/services/admin.api';
import { Location } from '@/types/admin.types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { LocationFormModal } from './LocationFormModal';

export const LocationListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', user?.business_id],
    queryFn: () => locationApi.getLocations(user!.business_id),
    enabled: !!user?.business_id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (locationId: string) => locationApi.deleteLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', user?.business_id] });
      toast.success('Location deleted successfully');
      setLocationToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete location', error.message);
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (locationId: string) => locationApi.setLocationPrimary(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', user?.business_id] });
      toast.success('Primary location updated');
    },
    onError: (error: any) => {
      toast.error('Failed to set primary location', error.message);
    },
  });

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
  };

  const handleSetPrimary = (location: Location) => {
    setPrimaryMutation.mutate(location.id);
  };

  const columns = [
    {
      key: 'name',
      label: 'Location',
      render: (location: Location) => (
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{location.name}</div>
            <div className="text-sm text-gray-500">
              {location.address.street}, {location.address.city}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (location: Location) => (
        <span className="text-gray-900">{location.phone}</span>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (location: Location) => (
        <span className="text-sm text-gray-500">{location.timezone}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (location: Location) => (
        <div className="flex gap-2">
          <Badge variant={location.is_active ? 'success' : 'neutral'}>
            {location.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {location.is_primary && (
            <Badge variant="info">Primary</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (location: Location) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/admin/locations/${location.id}`)}
          >
            View Details
          </Button>
          {!location.is_primary && (
            <button
              onClick={() => handleSetPrimary(location)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Set Primary
            </button>
          )}
          <button
            onClick={() => handleEdit(location)}
            className="text-gray-600 hover:text-gray-900"
            title="Edit location"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {!location.is_primary && (
            <button
              onClick={() => handleDelete(location)}
              className="text-red-600 hover:text-red-800"
              title="Delete location"
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
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business locations</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          data={locations?.data || []}
          columns={columns}
          keyExtractor={(location) => location.id}
          emptyMessage="No locations found. Create your first location to get started."
          isLoading={isLoading}
        />
      </div>

      {/* Create Modal */}
      <LocationFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        businessId={user?.business_id || ''}
      />

      {/* Edit Modal */}
      {selectedLocation && (
        <LocationFormModal
          isOpen={true}
          onClose={() => setSelectedLocation(null)}
          businessId={user?.business_id || ''}
          location={selectedLocation}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        onConfirm={() => locationToDelete && deleteMutation.mutate(locationToDelete.id)}
        title="Delete Location"
        message={`Are you sure you want to delete "${locationToDelete?.name}"? This action cannot be undone and may affect future appointments.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
