import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { RevenueDataPoint } from '@/types/analytics.types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  chartType?: 'line' | 'bar';
  showAppointments?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  chartType = 'line',
  showAppointments = true,
}) => {
  // Format data for chart
  const chartData = data.map((point) => ({
    date: format(new Date(point.date), 'MMM d'),
    fullDate: point.date,
    revenue: point.revenue,
    appointments: point.appointments,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {format(new Date(payload[0].payload.fullDate), 'EEEE, MMM d, yyyy')}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Revenue:</span>
              <span className="text-sm font-semibold text-primary-600">
                {formatCurrency(payload[0].payload.revenue)}
              </span>
            </div>
            {showAppointments && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Appointments:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {payload[0].payload.appointments}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            yAxisId="revenue"
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          {showAppointments && (
            <YAxis
              yAxisId="appointments"
              orientation="right"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill="#6366f1"
            name="Revenue"
            radius={[4, 4, 0, 0]}
          />
          {showAppointments && (
            <Bar
              yAxisId="appointments"
              dataKey="appointments"
              fill="#10b981"
              name="Appointments"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          yAxisId="revenue"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        {showAppointments && (
          <YAxis
            yAxisId="appointments"
            orientation="right"
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          iconType="circle"
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue"
        />
        {showAppointments && (
          <Line
            yAxisId="appointments"
            type="monotone"
            dataKey="appointments"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Appointments"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
