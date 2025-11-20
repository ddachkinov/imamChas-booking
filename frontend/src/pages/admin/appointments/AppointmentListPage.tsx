import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { calendarApi } from '@/services/calendar.api';
import { useCalendar, filterAppointments } from '@/contexts/CalendarContext';
import { CalendarFilters } from '@/pages/calendar/components/CalendarFilters';
import { CalendarSearch } from '@/pages/calendar/components/CalendarSearch';
import { AppointmentDetailSidebar } from '@/pages/calendar/components/AppointmentDetailSidebar';
import { StatusBadge } from '@/pages/calendar/components/StatusBadge';
import { CalendarExportMenu } from '@/pages/calendar/components/CalendarExportMenu';
import { CalendarProvider } from '@/contexts/CalendarContext';
import type { CalendarAppointment } from '@/types/calendar.types';

const AppointmentListContent: React.FC = () => {
  const { user } = useAuth();
  const { state, actions } = useCalendar();
  const businessId = user?.tenant_id || '';

  // Date range for query (last 30 days to next 90 days)
  const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const endDate = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  // Fetch appointments
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['appointments-list', businessId, state.filters],
    queryFn: () =>
      calendarApi.getCalendarData({
        businessId,
        view: 'month',
        startDate,
        endDate,
        status: state.filters.status.length > 0 ? state.filters.status : undefined,
      }),
    enabled: !!businessId,
    staleTime: 30000,
  });

  // Filter appointments with null safety
  const filteredAppointments = calendarData?.appointments
    ? filterAppointments(calendarData.appointments, state.filters)
    : [];

  // Sort by date and time (upcoming first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`);
    const dateB = new Date(`${b.date}T${b.start_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    actions.selectAppointment(appointment.id);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'EEE, MMM d, yyyy');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all appointments
            </p>
          </div>
          {calendarData && (
            <CalendarExportMenu
              calendarData={calendarData}
              businessName={user?.business_name || 'Business'}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      {calendarData && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CalendarSearch />
            <CalendarFilters calendarData={calendarData} />
          </div>
        </div>
      )}

      {/* Appointment List */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.client_name}
                      </h3>
                      <StatusBadge status={appointment.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Service:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {appointment.service_name}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {formatDate(appointment.date)}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Time:</span>
                        <span className="ml-2 text-gray-900">
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </span>
                      </div>

                      {appointment.staff_name && (
                        <div>
                          <span className="text-gray-500">Staff:</span>
                          <span className="ml-2 text-gray-900">
                            {appointment.staff_name}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 text-gray-900">
                          {appointment.service_duration} min
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 text-gray-900 font-semibold">
                          ${appointment.price.toFixed(2)}
                        </span>
                      </div>

                      {appointment.location_name && (
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2 text-gray-900">
                            {appointment.location_name}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500">Appointment #:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">
                          {appointment.appointment_number}
                        </span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <p className="mt-1 text-gray-700">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && sortedAppointments.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

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

export const AppointmentListPage: React.FC = () => {
  return (
    <CalendarProvider>
      <AppointmentListContent />
    </CalendarProvider>
  );
};
