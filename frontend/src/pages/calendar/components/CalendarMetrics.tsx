import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { calendarApi } from '@/services/calendar.api';
import { CalendarIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface CalendarMetricsProps {
  businessId: string;
  date: Date;
}

export const CalendarMetrics: React.FC<CalendarMetricsProps> = ({ businessId, date }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['calendar-metrics', businessId, format(date, 'yyyy-MM-dd')],
    queryFn: () =>
      calendarApi.getCalendarMetrics({
        businessId,
        date: format(date, 'yyyy-MM-dd'),
      }),
    enabled: !!businessId,
    staleTime: 60000, // 1 minute
  });

  if (isLoading || !metrics) {
    return null;
  }

  const metricsData = [
    {
      name: 'Total Appointments',
      value: metrics.total_appointments,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Confirmed',
      value: metrics.confirmed_appointments,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Pending',
      value: metrics.pending_appointments,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Revenue Today',
      value: `$${metrics.revenue_today.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {metricsData.map((metric) => (
        <div key={metric.name} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{metric.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
