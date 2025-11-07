import React, { useState } from 'react';
import { Menu } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentTextIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useCalendar } from '@/contexts/CalendarContext';
import { exportToICalendar, exportToCSV, printAppointments } from '@/utils/export.utils';
import type { CalendarData } from '@/types/calendar.types';

interface CalendarExportMenuProps {
  calendarData: CalendarData;
  businessName: string;
}

export const CalendarExportMenu: React.FC<CalendarExportMenuProps> = ({
  calendarData,
  businessName,
}) => {
  const { state } = useCalendar();
  const [isExporting, setIsExporting] = useState(false);

  // Get appointments based on current filters
  const getFilteredAppointments = () => {
    // Apply filters similar to calendar views
    let appointments = calendarData.appointments;

    // Filter by status
    if (state.filters.status.length > 0) {
      appointments = appointments.filter((apt) =>
        state.filters.status.includes(apt.status)
      );
    }

    // Filter by staff
    if (state.filters.staff_ids.length > 0) {
      appointments = appointments.filter((apt) =>
        state.filters.staff_ids.includes(apt.staff_id)
      );
    }

    // Filter by search query
    if (state.filters.search_query) {
      const query = state.filters.search_query.toLowerCase();
      appointments = appointments.filter((apt) => {
        const matchesClient = apt.client_name.toLowerCase().includes(query);
        const matchesEmail = apt.client_email?.toLowerCase().includes(query);
        const matchesPhone = apt.client_phone?.toLowerCase().includes(query);
        const matchesService = apt.service_name.toLowerCase().includes(query);
        const matchesStaff = apt.staff_name?.toLowerCase().includes(query);
        const matchesNumber = apt.appointment_number?.toLowerCase().includes(query);

        return (
          matchesClient ||
          matchesEmail ||
          matchesPhone ||
          matchesService ||
          matchesStaff ||
          matchesNumber
        );
      });
    }

    return appointments;
  };

  // Get date range label for filename
  const getDateRangeLabel = (): string => {
    if (state.view === 'day') {
      return format(state.currentDate, 'yyyy-MM-dd');
    } else if (state.view === 'week') {
      // Week range
      const weekStart = new Date(state.currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${format(weekStart, 'yyyy-MM-dd')}_to_${format(weekEnd, 'yyyy-MM-dd')}`;
    } else {
      // Month
      return format(state.currentDate, 'yyyy-MM');
    }
  };

  // Get title for exports
  const getExportTitle = (): string => {
    if (state.view === 'day') {
      return `Appointments - ${format(state.currentDate, 'MMMM d, yyyy')}`;
    } else if (state.view === 'week') {
      return `Appointments - Week of ${format(state.currentDate, 'MMMM d, yyyy')}`;
    } else {
      return `Appointments - ${format(state.currentDate, 'MMMM yyyy')}`;
    }
  };

  const handleExportICalendar = async () => {
    try {
      setIsExporting(true);
      const appointments = getFilteredAppointments();

      if (appointments.length === 0) {
        alert('No appointments to export for the current view and filters.');
        return;
      }

      const dateRange = getDateRangeLabel();
      exportToICalendar(appointments, businessName, dateRange);
    } catch (error) {
      console.error('Export to iCalendar failed:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const appointments = getFilteredAppointments();

      if (appointments.length === 0) {
        alert('No appointments to export for the current view and filters.');
        return;
      }

      const dateRange = getDateRangeLabel();
      exportToCSV(appointments, dateRange);
    } catch (error) {
      console.error('Export to CSV failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      const appointments = getFilteredAppointments();

      if (appointments.length === 0) {
        alert('No appointments to print for the current view and filters.');
        return;
      }

      const title = getExportTitle();
      printAppointments(appointments, title, businessName);
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print. Please try again.');
    }
  };

  const appointmentCount = getFilteredAppointments().length;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        disabled={isExporting}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-500" />
        Export
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div className="py-1">
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
            {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''} in current view
          </div>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleExportICalendar}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm`}
              >
                <CalendarIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Export to iCalendar</span>
                  <span className="text-xs text-gray-500">Compatible with Google Calendar, Outlook</span>
                </div>
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleExportCSV}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Export to CSV</span>
                  <span className="text-xs text-gray-500">Open in Excel, Google Sheets</span>
                </div>
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handlePrint}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm`}
              >
                <PrinterIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Print</span>
                  <span className="text-xs text-gray-500">Print appointment list</span>
                </div>
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
};
