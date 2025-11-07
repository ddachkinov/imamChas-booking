import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { serviceApi } from '@/services/admin.api';
import { Service, ServiceFilters } from '@/types/admin.types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { ServiceFormModal } from './ServiceFormModal';

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

export const ServiceListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    category: '',
    is_active: undefined,
  });

  // Fetch services
  const { data: services, isLoading } = useQuery({
    queryKey: ['services', user?.business_id, filters],
    queryFn: () => serviceApi.getServices(user!.business_id, filters),
    enabled: !!user?.business_id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => serviceApi.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.business_id] });
      toast.success('Service deleted successfully');
      setServiceToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete service', error.message);
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (serviceId: string) => serviceApi.duplicateService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.business_id] });
      toast.success('Service duplicated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to duplicate service', error.message);
    },
  });

  // Bulk deactivate mutation
  const bulkDeactivateMutation = useMutation({
    mutationFn: (serviceIds: string[]) => serviceApi.bulkDeactivate(serviceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.business_id] });
      toast.success(`${selectedServices.length} services deactivated`);
      setSelectedServices([]);
    },
    onError: (error: any) => {
      toast.error('Failed to deactivate services', error.message);
    },
  });

  const handleEdit = (service: Service) => {
    setSelectedService(service);
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
  };

  const handleDuplicate = (service: Service) => {
    duplicateMutation.mutate(service.id);
  };

  const handleBulkDeactivate = () => {
    if (selectedServices.length > 0) {
      bulkDeactivateMutation.mutate(selectedServices);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedServices.length === services?.data.length && services?.data.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedServices(services?.data.map((s) => s.id) || []);
            } else {
              setSelectedServices([]);
            }
          }}
          className="rounded border-gray-300"
        />
      ),
      render: (service: Service) => (
        <input
          type="checkbox"
          checked={selectedServices.includes(service.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedServices([...selectedServices, service.id]);
            } else {
              setSelectedServices(selectedServices.filter((id) => id !== service.id));
            }
          }}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: 'name',
      label: 'Service',
      render: (service: Service) => (
        <div>
          <div className="font-medium text-gray-900">{service.name}</div>
          {service.description && (
            <div className="text-sm text-gray-500 line-clamp-1">{service.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (service: Service) => (
        <Badge variant="neutral">{service.category}</Badge>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (service: Service) => (
        <span className="text-sm text-gray-900">{formatDuration(service.duration_minutes)}</span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (service: Service) => (
        <span className="font-medium text-gray-900">
          ${service.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (service: Service) => (
        <Badge variant={service.is_active ? 'success' : 'neutral'}>
          {service.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (service: Service) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/admin/services/${service.id}`)}
          >
            View Details
          </Button>
          <button
            onClick={() => handleDuplicate(service)}
            className="text-gray-600 hover:text-gray-900"
            title="Duplicate service"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEdit(service)}
            className="text-gray-600 hover:text-gray-900"
            title="Edit service"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(service)}
            className="text-red-600 hover:text-red-800"
            title="Delete service"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your service catalog</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search services..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <Select
            value={filters.category || ''}
            onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
            options={SERVICE_CATEGORIES}
            id="category-filter"
          />
          <Select
            value={filters.is_active === undefined ? '' : String(filters.is_active)}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_active: e.target.value === '' ? undefined : e.target.value === 'true',
              })
            }
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            id="status-filter"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedServices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-900">
              {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedServices([])}>
                Clear Selection
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkDeactivate}>
                Deactivate Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          data={services?.data || []}
          columns={columns}
          keyExtractor={(service) => service.id}
          emptyMessage="No services found. Create your first service to get started."
          isLoading={isLoading}
        />
      </div>

      {/* Create Modal */}
      <ServiceFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        businessId={user?.business_id || ''}
      />

      {/* Edit Modal */}
      {selectedService && (
        <ServiceFormModal
          isOpen={true}
          onClose={() => setSelectedService(null)}
          businessId={user?.business_id || ''}
          service={selectedService}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => serviceToDelete && deleteMutation.mutate(serviceToDelete.id)}
        title="Delete Service"
        message={`Are you sure you want to delete "${serviceToDelete?.name}"? This will prevent new bookings but preserve historical data.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
