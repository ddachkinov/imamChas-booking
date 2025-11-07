import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi } from '@/services/analytics.api';
import { MetricCard } from './components/MetricCard';
import { DateRangeSelector } from './components/DateRangeSelector';
import { RevenueChart } from './components/RevenueChart';
import { TopServices, TopStaff } from './components/TopPerformers';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { DateRange, AnalyticsQuery } from '@/types/analytics.types';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const businessId = user?.tenant_id || '';

  // Date range state (default to last 30 days)
  const [dateRange, setDateRange] = useState<DateRange>({
    start_date: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    preset: 'last_30_days',
  });

  // Chart type toggle
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Query parameters
  const query: AnalyticsQuery = {
    business_id: businessId,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    compare_to_previous: true,
  };

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', query],
    queryFn: () => analyticsApi.getAnalyticsOverview(query),
    enabled: !!businessId,
    staleTime: 60000,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics-revenue', query],
    queryFn: () => analyticsApi.getRevenueByDay(query),
    enabled: !!businessId,
    staleTime: 60000,
  });

  const { data: topServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['analytics-top-services', query],
    queryFn: () => analyticsApi.getTopServices({ ...query, limit: 5 }),
    enabled: !!businessId,
    staleTime: 60000,
  });

  const { data: topStaff, isLoading: staffLoading } = useQuery({
    queryKey: ['analytics-top-staff', query],
    queryFn: () => analyticsApi.getTopStaff({ ...query, limit: 5 }),
    enabled: !!businessId,
    staleTime: 60000,
  });

  const isLoading = overviewLoading || revenueLoading || servicesLoading || staffLoading;

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Business performance metrics and insights
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector value={dateRange} onChange={setDateRange} />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Metrics */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={overview.total_revenue}
                  change={overview.revenue_change}
                  format="currency"
                  icon={<CurrencyDollarIcon className="w-6 h-6" />}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-50"
                />
                <MetricCard
                  title="Total Appointments"
                  value={overview.total_appointments}
                  change={overview.appointments_change}
                  format="number"
                  icon={<CalendarIcon className="w-6 h-6" />}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-50"
                />
                <MetricCard
                  title="Completed"
                  value={overview.completed_appointments}
                  format="number"
                  icon={<CheckCircleIcon className="w-6 h-6" />}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-50"
                  subtitle={`${overview.completion_rate.toFixed(1)}% completion rate`}
                />
                <MetricCard
                  title="Cancelled"
                  value={overview.cancelled_appointments}
                  format="number"
                  icon={<XCircleIcon className="w-6 h-6" />}
                  iconColor="text-red-600"
                  iconBgColor="bg-red-50"
                  subtitle={`${overview.cancellation_rate.toFixed(1)}% cancellation rate`}
                />
                <MetricCard
                  title="New Clients"
                  value={overview.new_clients}
                  change={overview.new_clients_change}
                  format="number"
                  icon={<UserGroupIcon className="w-6 h-6" />}
                  iconColor="text-primary-600"
                  iconBgColor="bg-primary-50"
                />
                <MetricCard
                  title="Avg Appointment Value"
                  value={overview.average_appointment_value}
                  format="currency"
                  icon={<CurrencyDollarIcon className="w-6 h-6" />}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-50"
                  subtitle={`${overview.average_appointment_duration}min avg duration`}
                />
              </div>
            )}

            {/* Revenue Chart */}
            {revenueData && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Revenue Over Time</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Daily revenue and appointment count
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        chartType === 'line'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Line
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        chartType === 'bar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Bar
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  <RevenueChart
                    data={revenueData.data_points}
                    chartType={chartType}
                    showAppointments
                  />
                </div>
              </div>
            )}

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Services</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Highest revenue generating services
                  </p>
                </div>
                {topServices ? (
                  <TopServices services={topServices} />
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                )}
              </div>

              {/* Top Staff */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Staff</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Highest performing staff members
                  </p>
                </div>
                {topStaff ? (
                  <TopStaff staff={topStaff} />
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                )}
              </div>
            </div>

            {/* Additional Stats */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <ClockIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">No-Show Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.no_show_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {overview.no_show_appointments} no-shows
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.total_clients}
                      </p>
                      <p className="text-xs text-gray-500">
                        {overview.returning_clients} returning
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.completion_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {overview.completed_appointments} completed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
