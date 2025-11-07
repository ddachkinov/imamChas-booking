import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  CreditCardIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, any>;
  connected_at?: string;
  features: string[];
}

interface IntegrationSettings {
  integrations: Integration[];
}

export const IntegrationSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const businessId = user?.tenant_id || '';
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null);

  // Fetch integration settings
  const { data: settings, isLoading } = useQuery<IntegrationSettings>({
    queryKey: ['integration-settings', businessId],
    queryFn: async () => {
      // Mock data for now
      return {
        integrations: [
          {
            id: 'google-calendar',
            name: 'Google Calendar',
            description: 'Sync appointments with Google Calendar',
            icon: CalendarIcon,
            iconBgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            status: 'disconnected',
            features: ['Two-way sync', 'Automatic updates', 'Conflict detection'],
          },
          {
            id: 'stripe',
            name: 'Stripe',
            description: 'Accept online payments',
            icon: CreditCardIcon,
            iconBgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            status: 'connected',
            connected_at: '2025-10-15T10:30:00Z',
            config: { account_id: 'acct_1234567890' },
            features: ['Credit card processing', 'Refunds', 'Recurring billing'],
          },
          {
            id: 'mailgun',
            name: 'Mailgun',
            description: 'Send email notifications',
            icon: EnvelopeIcon,
            iconBgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            status: 'connected',
            connected_at: '2025-10-12T14:20:00Z',
            config: { domain: 'mg.example.com' },
            features: ['Transactional emails', 'Email templates', 'Delivery tracking'],
          },
          {
            id: 'twilio',
            name: 'Twilio',
            description: 'Send SMS notifications',
            icon: DevicePhoneMobileIcon,
            iconBgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            status: 'disconnected',
            features: ['SMS reminders', 'Two-way messaging', 'Delivery receipts'],
          },
          {
            id: 'zapier',
            name: 'Zapier',
            description: 'Connect to 3,000+ apps',
            icon: LinkIcon,
            iconBgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            status: 'disconnected',
            features: ['Custom workflows', 'Automation', 'No-code integration'],
          },
          {
            id: 'outlook-calendar',
            name: 'Outlook Calendar',
            description: 'Sync with Microsoft Outlook',
            icon: CalendarIcon,
            iconBgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            status: 'error',
            features: ['Calendar sync', 'Meeting invites', 'Availability sharing'],
          },
        ],
      };
    },
    enabled: !!businessId,
  });

  // Connect integration
  const connectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // TODO: Replace with actual OAuth flow or API configuration
      // For OAuth integrations, this would redirect to provider's auth page
      return new Promise((resolve) => setTimeout(resolve, 1500));
    },
    onSuccess: (_, integrationId) => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings', businessId] });
      showToast('Integration connected successfully', 'success');
      setConnectingIntegration(null);
    },
    onError: () => {
      showToast('Failed to connect integration', 'error');
      setConnectingIntegration(null);
    },
  });

  // Disconnect integration
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // TODO: Replace with actual API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings', businessId] });
      showToast('Integration disconnected', 'success');
    },
    onError: () => {
      showToast('Failed to disconnect integration', 'error');
    },
  });

  const handleConnect = (integrationId: string) => {
    setConnectingIntegration(integrationId);
    connectMutation.mutate(integrationId);
  };

  const handleDisconnect = (integrationId: string, integrationName: string) => {
    if (confirm(`Are you sure you want to disconnect ${integrationName}?`)) {
      disconnectMutation.mutate(integrationId);
    }
  };

  const handleConfigure = (integrationId: string) => {
    // TODO: Open configuration modal
    showToast('Configuration coming soon', 'info');
  };

  const getStatusBadge = (status: Integration['status']) => {
    const badges = {
      connected: {
        icon: CheckCircleIcon,
        text: 'Connected',
        className: 'bg-green-100 text-green-800',
      },
      disconnected: {
        icon: XCircleIcon,
        text: 'Not Connected',
        className: 'bg-gray-100 text-gray-800',
      },
      error: {
        icon: XCircleIcon,
        text: 'Error',
        className: 'bg-red-100 text-red-800',
      },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Error loading integrations</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Integrations</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect third-party services to extend functionality
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnecting = connectingIntegration === integration.id;
          const isConnected = integration.status === 'connected';
          const hasError = integration.status === 'error';

          return (
            <div
              key={integration.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${integration.iconBgColor}`}>
                      <Icon className={`w-6 h-6 ${integration.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(integration.status)}</div>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 pb-4">
                <ul className="space-y-1">
                  {integration.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connection Info */}
              {isConnected && integration.connected_at && (
                <div className="px-6 pb-4">
                  <p className="text-xs text-gray-500">
                    Connected on {new Date(integration.connected_at).toLocaleDateString()}
                  </p>
                  {integration.config && Object.keys(integration.config).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      {Object.entries(integration.config).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-900 font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {hasError && (
                <div className="px-6 pb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    Connection failed. Please reconnect or check your settings.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                {isConnected ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleConfigure(integration.id)}
                      className="flex-1"
                    >
                      Configure
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id, integration.name)}
                      disabled={disconnectMutation.isPending}
                      className="flex-1"
                    >
                      {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? 'Connecting...' : hasError ? 'Reconnect' : 'Connect'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Need help?</h3>
            <p className="text-sm text-blue-800 mt-1">
              Each integration has specific setup requirements. Visit our{' '}
              <a href="#" className="font-medium underline">
                integration guides
              </a>{' '}
              for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
