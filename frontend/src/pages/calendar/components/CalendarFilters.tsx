import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { useCalendar } from '@/contexts/CalendarContext';
import type { AppointmentStatus, CalendarData } from '@/types/calendar.types';

interface CalendarFiltersProps {
  calendarData: CalendarData;
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ calendarData }) => {
  const { state, actions } = useCalendar();

  const hasActiveFilters =
    state.filters.status.length > 0 ||
    state.filters.staff_ids.length > 0 ||
    state.filters.service_ids.length > 0;

  const toggleStatusFilter = (status: AppointmentStatus) => {
    const currentStatuses = state.filters.status;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    actions.setFilters({ status: newStatuses });
  };

  const toggleStaffFilter = (staffId: string) => {
    const currentStaff = state.filters.staff_ids;
    const newStaff = currentStaff.includes(staffId)
      ? currentStaff.filter((id) => id !== staffId)
      : [...currentStaff, staffId];
    actions.setFilters({ staff_ids: newStaff });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          <FunnelIcon className="w-4 h-4" />
          Status
          {state.filters.status.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
              {state.filters.status.length}
            </span>
          )}
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = state.filters.status.includes(option.value);
                return (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => toggleStatusFilter(option.value)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <CheckIcon className="w-5 h-5 text-primary-600" />}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Staff Filter */}
      {calendarData.staff_members.length > 0 && (
        <Menu as="div" className="relative">
          <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            <FunnelIcon className="w-4 h-4" />
            Staff
            {state.filters.staff_ids.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                {state.filters.staff_ids.length}
              </span>
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
              <div className="py-1">
                {calendarData.staff_members.map((staff) => {
                  const isSelected = state.filters.staff_ids.includes(staff.id);
                  return (
                    <Menu.Item key={staff.id}>
                      {({ active }) => (
                        <button
                          onClick={() => toggleStaffFilter(staff.id)}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700`}
                        >
                          <span>{staff.full_name}</span>
                          {isSelected && <CheckIcon className="w-5 h-5 text-primary-600" />}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={actions.clearFilters}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <XMarkIcon className="w-4 h-4" />
          Clear
        </button>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-600">
          {state.filters.status.length + state.filters.staff_ids.length} filters active
        </div>
      )}
    </div>
  );
};
