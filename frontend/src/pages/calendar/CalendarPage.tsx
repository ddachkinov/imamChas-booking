import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarProvider, useCalendar, getDateRange, formatDateRange } from '@/contexts/CalendarContext';
import { calendarApi } from '@/services/calendar.api';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';
import { AppointmentDetailSidebar } from './components/AppointmentDetailSidebar';
import { Button } from '@/components/ui/Button';
import type { CalendarView } from '@/types/calendar.types';

const CalendarContent: React.FC = () => {
  const { user } = useAuth();
  const { state, actions } = useCalendar();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const businessId = user?.tenant_id || '';

  // Get date range for current view
  const dateRange = getDateRange(state.currentView, state.currentDate);

  // Fetch calendar data
  const { data: calendarData, isLoading, error } = useQuery({
    queryKey: [
      'calendar',
      businessId,
      state.currentView,
      format(dateRange.start, 'yyyy-MM-dd'),
      format(dateRange.end, 'yyyy-MM-dd'),
      state.filters,
    ],
    queryFn: () =>
      calendarApi.getCalendarData({
        businessId,
        view: state.currentView,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        status: state.filters.status.length > 0 ? state.filters.status : undefined,
      }),
    enabled: !!businessId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });

  const handleViewChange = (view: CalendarView) => {
    actions.setView(view);
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load calendar</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      );
    }

    if (!calendarData) {
      return null;
    }

    switch (state.currentView) {
      case 'day':
      case 'resource':
        return <DayView calendarData={calendarData} />;
      case 'week':
        return <WeekView calendarData={calendarData} />;
      case 'month':
        return <MonthView calendarData={calendarData} />;
      default:
        return <DayView calendarData={calendarData} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: View selector and navigation */}
          <div className="flex items-center gap-4">
            {/* View selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  state.currentView === 'day' || state.currentView === 'resource'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  state.currentView === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => handleViewChange('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  state.currentView === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={actions.previousPeriod}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Previous"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <Button variant="secondary" onClick={actions.goToToday} size="sm">
                Today
              </Button>
              <button
                onClick={actions.nextPeriod}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Next"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Current date display */}
            <div className="flex items-center gap-2 text-gray-900">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">{formatDateRange(state.currentView, state.currentDate)}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<PlusIcon className="w-5 h-5" />}
            >
              New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      <div className="flex-1 overflow-hidden">{renderView()}</div>

      {/* Appointment detail sidebar */}
      {state.sidebarOpen && state.selectedAppointmentId && (
        <AppointmentDetailSidebar
          appointmentId={state.selectedAppointmentId}
          onClose={actions.closeSidebar}
        />
      )}
    </div>
  );
};

export const CalendarPage: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  );
};
