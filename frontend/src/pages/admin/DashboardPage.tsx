import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi } from '@/services/admin.api';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type DateRangePreset = 'today' | 'week' | 'month' | 'last_month' | 'custom';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('month');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

  // Calculate date range based on preset
  const getDateRange = () => {
    const today = new Date();
    switch (datePreset) {
      case 'today':
        return { start_date: format(today, 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
      case 'week':
        return { start_date: format(subDays(today, 7), 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
      case 'month':
        return { start_date: format(startOfMonth(today), 'yyyy-MM-dd'), end_date: format(endOfMonth(today), 'yyyy-MM-dd') };
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        return { start_date: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end_date: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
      default:
        return { start_date: format(startOfMonth(today), 'yyyy-MM-dd'), end_date: format(endOfMonth(today), 'yyyy-MM-dd') };
    }
  };

  const dateRange = getDateRange();

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics', 'metrics', user?.business_id, dateRange],
    queryFn: () => analyticsApi.getMetrics(user!.business_id, dateRange),
    enabled: !!user?.business_id,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue', user?.business_id, dateRange, granularity],
    queryFn: () => analyticsApi.getRevenueChart(user!.business_id, dateRange, granularity),
    enabled: !!user?.business_id,
  });

  const { data: appointmentVolume, isLoading: volumeLoading } = useQuery({
    queryKey: ['analytics', 'appointments', user?.business_id, dateRange, granularity],
    queryFn: () => analyticsApi.getAppointmentVolume(user!.business_id, dateRange, granularity),
    enabled: !!user?.business_id,
  });

  const { data: topServices } = useQuery({
    queryKey: ['analytics', 'top-services', user?.business_id, dateRange],
    queryFn: () => analyticsApi.getTopServices(user!.business_id, dateRange, 5),
    enabled: !!user?.business_id,
  });

  const { data: topStaff } = useQuery({
    queryKey: ['analytics', 'top-staff', user?.business_id, dateRange],
    queryFn: () => analyticsApi.getTopStaff(user!.business_id, dateRange, 5),
    enabled: !!user?.business_id,
  });

  const { data: statusBreakdown } = useQuery({
    queryKey: ['analytics', 'status-breakdown', user?.business_id, dateRange],
    queryFn: () => analyticsApi.getAppointmentStatusBreakdown(user!.business_id, dateRange),
    enabled: !!user?.business_id,
  });

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${metrics?.data.total_revenue?.toFixed(2) || '0.00'}`,
      change: metrics?.data.total_revenue_change || 0,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Appointments',
      value: metrics?.data.total_appointments || 0,
      change: metrics?.data.total_appointments_change || 0,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'New Clients',
      value: metrics?.data.new_clients || 0,
      change: metrics?.data.new_clients_change || 0,
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Avg Appointment Value',
      value: `$${metrics?.data.average_appointment_value?.toFixed(2) || '0.00'}`,
      change: metrics?.data.average_appointment_value_change || 0,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const pieData = statusBreakdown ? [
    { name: 'Completed', value: statusBreakdown.data.completed },
    { name: 'Upcoming', value: statusBreakdown.data.upcoming },
    { name: 'Cancelled', value: statusBreakdown.data.cancelled },
    { name: 'No Show', value: statusBreakdown.data.no_show },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Analytics and key metrics for your business</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {(['today', 'week', 'month', 'last_month'] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                datePreset === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset === 'last_month' ? 'Last Month' : preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      {stat.change !== 0 && (
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stat.change > 0 ? (
                            <ArrowUpIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          )}
                          <span className="ml-1">{Math.abs(stat.change).toFixed(1)}%</span>
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="overflow-hidden rounded-lg bg-white shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    granularity === g
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Volume Chart */}
        <div className="overflow-hidden rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentVolume?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Services */}
        <div className="overflow-hidden rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Services by Revenue</h3>
          <div className="space-y-3">
            {topServices?.data.map((service, index) => (
              <div key={service.service_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm text-gray-900 truncate ml-2">{service.service_name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${service.revenue.toFixed(2)}</span>
              </div>
            ))}
            {(!topServices?.data || topServices.data.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Top Staff */}
        <div className="overflow-hidden rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Staff by Appointments</h3>
          <div className="space-y-3">
            {topStaff?.data.map((staff, index) => (
              <div key={staff.staff_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm text-gray-900 truncate ml-2">{staff.staff_name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{staff.appointment_count}</span>
              </div>
            ))}
            {(!topStaff?.data || topStaff.data.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="overflow-hidden rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
