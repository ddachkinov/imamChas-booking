import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  events: {
    appointment_created: { email: boolean; sms: boolean; push: boolean };
    appointment_confirmed: { email: boolean; sms: boolean; push: boolean };
    appointment_cancelled: { email: boolean; sms: boolean; push: boolean };
    appointment_reminder: { email: boolean; sms: boolean; push: boolean };
    appointment_completed: { email: boolean; sms: boolean; push: boolean };
    payment_received: { email: boolean; sms: boolean; push: boolean };
    client_registered: { email: boolean; sms: boolean; push: boolean };
    staff_assigned: { email: boolean; sms: boolean; push: boolean };
  };
}

const notificationEvents = [
  {
    key: 'appointment_created' as const,
    label: 'New Appointment',
    description: 'When a new appointment is booked',
  },
  {
    key: 'appointment_confirmed' as const,
    label: 'Appointment Confirmed',
    description: 'When an appointment is confirmed',
  },
  {
    key: 'appointment_cancelled' as const,
    label: 'Appointment Cancelled',
    description: 'When an appointment is cancelled',
  },
  {
    key: 'appointment_reminder' as const,
    label: 'Appointment Reminder',
    description: 'Reminder before scheduled appointment',
  },
  {
    key: 'appointment_completed' as const,
    label: 'Appointment Completed',
    description: 'When an appointment is marked as completed',
  },
  {
    key: 'payment_received' as const,
    label: 'Payment Received',
    description: 'When a payment is successfully processed',
  },
  {
    key: 'client_registered' as const,
    label: 'New Client',
    description: 'When a new client registers',
  },
  {
    key: 'staff_assigned' as const,
    label: 'Staff Assignment',
    description: 'When staff is assigned to an appointment',
  },
];

export const NotificationSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const businessId = user?.tenant_id || '';

  // Fetch notification settings
  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ['notification-settings', businessId],
    queryFn: async () => {
      // Mock data for now
      return {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        events: {
          appointment_created: { email: true, sms: false, push: true },
          appointment_confirmed: { email: true, sms: false, push: true },
          appointment_cancelled: { email: true, sms: true, push: true },
          appointment_reminder: { email: true, sms: true, push: true },
          appointment_completed: { email: false, sms: false, push: false },
          payment_received: { email: true, sms: false, push: true },
          client_registered: { email: true, sms: false, push: false },
          staff_assigned: { email: true, sms: false, push: true },
        },
      };
    },
    enabled: !!businessId,
  });

  // Update notification settings
  const updateMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      // TODO: Replace with actual API call
      // return api.updateNotificationSettings(businessId, newSettings);
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', businessId] });
      showToast('Notification settings updated successfully', 'success');
    },
    onError: () => {
      showToast('Failed to update notification settings', 'error');
    },
  });

  const handleChannelToggle = (channel: 'email' | 'sms' | 'push') => {
    if (!settings) return;
    const key = `${channel}_enabled` as const;
    updateMutation.mutate({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleEventToggle = (
    eventKey: keyof NotificationSettings['events'],
    channel: 'email' | 'sms' | 'push'
  ) => {
    if (!settings) return;
    updateMutation.mutate({
      ...settings,
      events: {
        ...settings.events,
        [eventKey]: {
          ...settings.events[eventKey],
          [channel]: !settings.events[eventKey][channel],
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Error loading settings</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure how you receive notifications for important events
        </p>
      </div>

      {/* Channel Toggles */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        <div className="p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <button
                onClick={() => handleChannelToggle('email')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.email_enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.email_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via text message</p>
                </div>
              </div>
              <button
                onClick={() => handleChannelToggle('sms')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.sms_enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.sms_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BellIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive in-app push notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleChannelToggle('push')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.push_enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.push_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event-specific Settings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">Event Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose which events trigger notifications for each channel
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SMS
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Push
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notificationEvents.map((event) => (
                <tr key={event.key}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.label}</p>
                      <p className="text-xs text-gray-500">{event.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={settings.events[event.key].email}
                      onChange={() => handleEventToggle(event.key, 'email')}
                      disabled={!settings.email_enabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={settings.events[event.key].sms}
                      onChange={() => handleEventToggle(event.key, 'sms')}
                      disabled={!settings.sms_enabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={settings.events[event.key].push}
                      onChange={() => handleEventToggle(event.key, 'push')}
                      disabled={!settings.push_enabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
