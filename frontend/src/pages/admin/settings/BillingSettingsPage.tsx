import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    locations: number;
    staff: number;
    appointments_per_month: number;
    storage_gb: number;
  };
}

interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface Invoice {
  id: string;
  number: string;
  amount_paid: number;
  status: 'paid' | 'open' | 'void';
  created: string;
  period_start: string;
  period_end: string;
  pdf_url?: string;
}

interface Usage {
  period: string;
  locations: number;
  staff: number;
  appointments: number;
  storage_gb: number;
}

interface BillingData {
  subscription: Subscription;
  payment_methods: PaymentMethod[];
  invoices: Invoice[];
  usage: Usage;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      'Up to 2 locations',
      'Up to 5 staff members',
      'Unlimited appointments',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      locations: 2,
      staff: 5,
      appointments_per_month: 999999,
      storage_gb: 5,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    features: [
      'Up to 5 locations',
      'Up to 20 staff members',
      'Unlimited appointments',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'Calendar integrations',
    ],
    limits: {
      locations: 5,
      staff: 20,
      appointments_per_month: 999999,
      storage_gb: 25,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited locations',
      'Unlimited staff',
      'Unlimited appointments',
      'Dedicated support',
      'Custom analytics',
      'White labeling',
      'API access',
      'SSO/SAML',
    ],
    limits: {
      locations: 999999,
      staff: 999999,
      appointments_per_month: 999999,
      storage_gb: 100,
    },
  },
];

export const BillingSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const businessId = user?.tenant_id || '';
  const [showPlans, setShowPlans] = useState(false);

  // Fetch billing data
  const { data: billingData, isLoading } = useQuery<BillingData>({
    queryKey: ['billing-data', businessId],
    queryFn: async () => {
      // Mock data for now
      return {
        subscription: {
          plan: plans[1], // Professional plan
          status: 'active',
          current_period_start: '2025-10-01T00:00:00Z',
          current_period_end: '2025-11-01T00:00:00Z',
          cancel_at_period_end: false,
        },
        payment_methods: [
          {
            id: 'pm_1',
            brand: 'Visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2026,
            is_default: true,
          },
          {
            id: 'pm_2',
            brand: 'Mastercard',
            last4: '5555',
            exp_month: 6,
            exp_year: 2027,
            is_default: false,
          },
        ],
        invoices: [
          {
            id: 'in_1',
            number: 'INV-2025-001',
            amount_paid: 79,
            status: 'paid',
            created: '2025-10-01T00:00:00Z',
            period_start: '2025-10-01T00:00:00Z',
            period_end: '2025-11-01T00:00:00Z',
            pdf_url: '#',
          },
          {
            id: 'in_2',
            number: 'INV-2025-002',
            amount_paid: 79,
            status: 'paid',
            created: '2025-09-01T00:00:00Z',
            period_start: '2025-09-01T00:00:00Z',
            period_end: '2025-10-01T00:00:00Z',
            pdf_url: '#',
          },
        ],
        usage: {
          period: 'October 2025',
          locations: 3,
          staff: 12,
          appointments: 245,
          storage_gb: 8.5,
        },
      };
    },
    enabled: !!businessId,
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      // TODO: Replace with actual API call
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-data', businessId] });
      showToast('Plan changed successfully', 'success');
      setShowPlans(false);
    },
    onError: () => {
      showToast('Failed to change plan', 'error');
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with actual API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-data', businessId] });
      showToast('Subscription cancelled', 'success');
    },
    onError: () => {
      showToast('Failed to cancel subscription', 'error');
    },
  });

  const handleCancelSubscription = () => {
    if (
      confirm(
        'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
      )
    ) {
      cancelMutation.mutate();
    }
  };

  const handleChangePlan = (planId: string) => {
    changePlanMutation.mutate(planId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    showToast('Downloading invoice...', 'info');
    // TODO: Implement actual download
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      active: { text: 'Active', className: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Cancelled', className: 'bg-red-100 text-red-800' },
      past_due: { text: 'Past Due', className: 'bg-yellow-100 text-yellow-800' },
      trialing: { text: 'Trial', className: 'bg-blue-100 text-blue-800' },
      paid: { text: 'Paid', className: 'bg-green-100 text-green-800' },
      open: { text: 'Open', className: 'bg-yellow-100 text-yellow-800' },
      void: { text: 'Void', className: 'bg-gray-100 text-gray-800' },
    };

    const badge = badges[status] || badges.active;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
      >
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

  if (!billingData) {
    return <div>Error loading billing data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Billing & Subscription</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription, payment methods, and invoices
        </p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-900">Current Plan</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your subscription and plan details
              </p>
            </div>
            {getStatusBadge(billingData.subscription.status)}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {billingData.subscription.plan.name}
              </p>
              <p className="text-sm text-gray-500">
                ${billingData.subscription.plan.price}/{billingData.subscription.plan.interval}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setShowPlans(!showPlans)}>
              {showPlans ? 'Hide Plans' : 'Change Plan'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Billing Period</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {format(new Date(billingData.subscription.current_period_start), 'MMM d')} -{' '}
                {format(new Date(billingData.subscription.current_period_end), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Next Billing Date</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {format(new Date(billingData.subscription.current_period_end), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {billingData.subscription.status === 'active' && !billingData.subscription.cancel_at_period_end && (
            <Button variant="secondary" onClick={handleCancelSubscription}>
              Cancel Subscription
            </Button>
          )}

          {billingData.subscription.cancel_at_period_end && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Your subscription will be cancelled at the end of the current billing period.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      {showPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === billingData.subscription.plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow border-2 ${
                  isCurrentPlan ? 'border-primary-600' : 'border-gray-200'
                } overflow-hidden`}
              >
                <div className="p-6">
                  {isCurrentPlan && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mb-4">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Current Plan
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-1">/{plan.interval}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && (
                    <Button
                      variant="primary"
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={changePlanMutation.isPending}
                      className="w-full mt-6"
                    >
                      {changePlanMutation.isPending ? 'Changing...' : 'Select Plan'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">Current Usage</h3>
          <p className="text-sm text-gray-500 mt-0.5">{billingData.usage.period}</p>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Locations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {billingData.usage.locations}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of {billingData.subscription.plan.limits.locations} available
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Staff Members</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{billingData.usage.staff}</p>
            <p className="text-xs text-gray-500 mt-1">
              of {billingData.subscription.plan.limits.staff} available
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Appointments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {billingData.usage.appointments}
            </p>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Storage</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {billingData.usage.storage_gb} GB
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of {billingData.subscription.plan.limits.storage_gb} GB available
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">Payment Methods</h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage your payment methods</p>
          </div>
          <Button variant="primary" size="sm">
            Add Method
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {billingData.payment_methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <CreditCardIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires {method.exp_month}/{method.exp_year}
                  </p>
                </div>
                {method.is_default && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!method.is_default && (
                  <Button variant="secondary" size="sm">
                    Set Default
                  </Button>
                )}
                <Button variant="secondary" size="sm">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">Invoice History</h3>
          <p className="text-sm text-gray-500 mt-0.5">Download your invoices and receipts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingData.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invoice.created), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${invoice.amount_paid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-900"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download
                    </button>
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
