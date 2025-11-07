import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '@/services/admin.api';
import { Client, ClientFilters } from '@/types/admin.types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/useToast';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const ClientListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Filters
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
  });

  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', user?.business_id, filters],
    queryFn: () => clientApi.getClients(user!.business_id, filters),
    enabled: !!user?.business_id,
  });

  const handleExport = async () => {
    try {
      const blob = await clientApi.exportClients(user!.business_id, [
        'name',
        'email',
        'phone',
        'total_appointments',
        'lifetime_value',
      ]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Clients exported successfully');
    } catch (error: any) {
      toast.error('Failed to export clients', error.message);
    }
  };

  const getClientTier = (appointmentCount: number) => {
    if (appointmentCount === 0) return { label: 'New', variant: 'info' as const };
    if (appointmentCount < 5) return { label: 'Regular', variant: 'neutral' as const };
    return { label: 'VIP', variant: 'warning' as const };
  };

  const columns = [
    {
      key: 'client',
      label: 'Client',
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={client.user.avatar_url}
            name={`${client.user.first_name} ${client.user.last_name}`}
            size="md"
          />
          <div>
            <div className="font-medium text-gray-900">
              {client.user.first_name} {client.user.last_name}
            </div>
            <div className="text-sm text-gray-500">{client.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (client: Client) => (
        <span className="text-sm text-gray-900">{client.user.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'appointments',
      label: 'Appointments',
      render: (client: Client) => {
        const tier = getClientTier(client.total_appointments);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{client.total_appointments}</span>
            <Badge variant={tier.variant} size="sm">
              {tier.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'last_visit',
      label: 'Last Visit',
      render: (client: Client) => (
        <span className="text-sm text-gray-500">
          {client.last_appointment_date
            ? format(new Date(client.last_appointment_date), 'MMM d, yyyy')
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'lifetime_value',
      label: 'Lifetime Value',
      render: (client: Client) => (
        <span className="font-medium text-gray-900">${client.lifetime_value.toFixed(2)}</span>
      ),
    },
    {
      key: 'stats',
      label: 'Performance',
      render: (client: Client) => {
        const noShowRate =
          client.total_appointments > 0
            ? (client.no_show_appointments / client.total_appointments) * 100
            : 0;
        const cancelRate =
          client.total_appointments > 0
            ? (client.cancelled_appointments / client.total_appointments) * 100
            : 0;

        return (
          <div className="text-xs text-gray-500">
            {noShowRate > 20 && (
              <div className="text-red-600">No-show: {noShowRate.toFixed(0)}%</div>
            )}
            {cancelRate > 30 && (
              <div className="text-yellow-600">Cancel: {cancelRate.toFixed(0)}%</div>
            )}
            {noShowRate <= 20 && cancelRate <= 30 && (
              <div className="text-green-600">Excellent</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (client: Client) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/admin/clients/${client.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your client database</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            className="inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </Button>
          <Button className="inline-flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          data={clients?.data || []}
          columns={columns}
          keyExtractor={(client) => client.id}
          emptyMessage="No clients found. Clients will appear here after their first booking."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
