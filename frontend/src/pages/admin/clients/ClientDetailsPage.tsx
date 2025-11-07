import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { clientApi } from '@/services/admin.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/useToast';
import { ArrowLeftIcon, CalendarIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const ClientDetailsPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState('');

  // Fetch client details
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientApi.getClient(clientId!),
    enabled: !!clientId,
  });

  // Fetch client notes
  const { data: notes } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => clientApi.getNotes(clientId!),
    enabled: !!clientId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (content: string) => clientApi.addNote(clientId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', clientId] });
      toast.success('Note added successfully');
      setNewNote('');
    },
    onError: (error: any) => {
      toast.error('Failed to add note', error.message);
    },
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  if (isLoading || !client) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const clientData = client.data;
  const noShowRate = clientData.total_appointments > 0
    ? (clientData.no_show_appointments / clientData.total_appointments) * 100
    : 0;
  const cancelRate = clientData.total_appointments > 0
    ? (clientData.cancelled_appointments / clientData.total_appointments) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/clients')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Clients
        </Button>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={clientData.user.avatar_url}
              name={`${clientData.user.first_name} ${clientData.user.last_name}`}
              size="xl"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {clientData.user.first_name} {clientData.user.last_name}
              </h1>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">{clientData.user.email}</p>
                {clientData.user.phone && (
                  <p className="text-sm text-gray-600">{clientData.user.phone}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {clientData.total_appointments === 0 && <Badge variant="info">New Client</Badge>}
                {clientData.total_appointments >= 5 && <Badge variant="warning">VIP</Badge>}
                {noShowRate > 20 && <Badge variant="error">High No-Show</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{clientData.total_appointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lifetime Value</p>
              <p className="text-2xl font-semibold text-gray-900">${clientData.lifetime_value.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{clientData.completed_appointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Visit</p>
              <p className="text-sm font-semibold text-gray-900">
                {clientData.last_appointment_date
                  ? format(new Date(clientData.last_appointment_date), 'MMM d, yyyy')
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Cancellation Rate</p>
            <p className={`text-2xl font-semibold ${cancelRate > 30 ? 'text-red-600' : 'text-green-600'}`}>
              {cancelRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {clientData.cancelled_appointments} of {clientData.total_appointments} appointments
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">No-Show Rate</p>
            <p className={`text-2xl font-semibold ${noShowRate > 20 ? 'text-red-600' : 'text-green-600'}`}>
              {noShowRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {clientData.no_show_appointments} of {clientData.total_appointments} appointments
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
            <p className="text-2xl font-semibold text-green-600">
              {clientData.total_appointments > 0
                ? ((clientData.completed_appointments / clientData.total_appointments) * 100).toFixed(1)
                : '0'}%
            </p>
            <p className="text-xs text-gray-500">
              {clientData.completed_appointments} completed successfully
            </p>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

        {/* Add Note Form */}
        <div className="mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Add a note about this client..."
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              isLoading={addNoteMutation.isPending}
              size="sm"
            >
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes?.data && notes.data.length > 0 ? (
            notes.data.map((note) => (
              <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-900">{note.content}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {note.created_by_user
                      ? `${note.created_by_user.first_name} ${note.created_by_user.last_name}`
                      : 'Unknown'}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No notes yet. Add a note to keep track of important information about this client.
            </p>
          )}
        </div>
      </div>

      {/* Appointment History Placeholder */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment History</h2>
        <p className="text-sm text-gray-500">
          Appointment history will be displayed here once the appointments module is integrated.
        </p>
      </div>
    </div>
  );
};
