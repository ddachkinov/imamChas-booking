import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { DateRange, DateRangePreset } from '@/types/analytics.types';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presetOptions: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(
    value.preset || 'last_30_days'
  );
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);

    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    const range = getDateRangeForPreset(preset);
    onChange({ ...range, preset });
  };

  const getDateRangeForPreset = (preset: DateRangePreset): Omit<DateRange, 'preset'> => {
    const today = new Date();

    switch (preset) {
      case 'today':
        return {
          start_date: format(today, 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd'),
        };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return {
          start_date: format(yesterday, 'yyyy-MM-dd'),
          end_date: format(yesterday, 'yyyy-MM-dd'),
        };
      case 'last_7_days':
        return {
          start_date: format(subDays(today, 6), 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd'),
        };
      case 'last_30_days':
        return {
          start_date: format(subDays(today, 29), 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd'),
        };
      case 'this_month':
        return {
          start_date: format(startOfMonth(today), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        return {
          start_date: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      case 'this_year':
        return {
          start_date: format(startOfYear(today), 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd'),
        };
      default:
        return {
          start_date: format(subDays(today, 29), 'yyyy-MM-dd'),
          end_date: format(today, 'yyyy-MM-dd'),
        };
    }
  };

  const handleCustomDateChange = (field: 'start_date' | 'end_date', date: string) => {
    const newRange = {
      ...value,
      [field]: date,
      preset: 'custom' as DateRangePreset,
    };
    onChange(newRange);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900">Date Range</h3>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {presetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetChange(option.value)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedPreset === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={value.start_date}
              onChange={(e) => handleCustomDateChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={value.end_date}
              onChange={(e) => handleCustomDateChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Selected range display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Selected: {format(new Date(value.start_date), 'MMM d, yyyy')} -{' '}
          {format(new Date(value.end_date), 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  );
};
