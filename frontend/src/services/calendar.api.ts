import { apiService } from './api.service';
import type {
  CalendarData,
  CalendarView,
  CalendarAppointment,
  AppointmentFormData,
  QuickCreateFormData,
  RescheduleRequest,
  StatusUpdateRequest,
  BlockedTime,
  BlockedTimeFormData,
  AppointmentConflict,
  CalendarExportOptions,
  ClientSearchResult,
  ServiceOption,
  StaffOption,
  CalendarMetrics,
} from '@/types/calendar.types';

/**
 * Calendar API Service
 * Handles all calendar-related API calls
 */
export const calendarApi = {
  /**
   * Get calendar data for specified date range and view
   */
  async getCalendarData(params: {
    businessId: string;
    view: CalendarView;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    staffId?: string;
    locationId?: string;
    status?: string[];
  }): Promise<CalendarData> {
    const queryParams = new URLSearchParams({
      view_type: params.view,
      date: params.startDate,
    });

    // Add business_id if provided
    if (params.businessId) {
      queryParams.append('business_id', params.businessId);
    }

    // Add end_date for resource view or multi-day views
    if (params.view === 'resource' || params.endDate) {
      queryParams.append('end_date', params.endDate);
    }

    // Add staff_member_ids as array parameter
    if (params.staffId) {
      queryParams.append('staff_member_ids', params.staffId);
    }

    // Add location_id if provided
    if (params.locationId) {
      queryParams.append('location_id', params.locationId);
    }

    // Include blocked time by default
    queryParams.append('include_blocked_time', 'true');
    queryParams.append('include_availability', 'true');

    // Note: status filtering happens on the backend via query parameters
    // The backend will need to support status filtering if needed

    const response = await apiService.get<CalendarData>(`/calendar/view?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get single appointment details
   */
  async getAppointment(appointmentId: string): Promise<CalendarAppointment> {
    const response = await apiService.get<CalendarAppointment>(`/appointments/${appointmentId}`);
    return response.data;
  },

  /**
   * Create new appointment
   */
  async createAppointment(data: AppointmentFormData): Promise<CalendarAppointment> {
    const response = await apiService.post<CalendarAppointment>('/appointments', data);
    return response.data;
  },

  /**
   * Quick create appointment (simplified form)
   */
  async quickCreateAppointment(data: QuickCreateFormData): Promise<CalendarAppointment> {
    const formData: AppointmentFormData = {
      ...data,
      status: 'confirmed',
      send_confirmation: true,
    };
    const response = await apiService.post<CalendarAppointment>('/appointments', formData);
    return response.data;
  },

  /**
   * Update existing appointment
   */
  async updateAppointment(
    appointmentId: string,
    data: Partial<AppointmentFormData>
  ): Promise<CalendarAppointment> {
    const response = await apiService.put<CalendarAppointment>(`/appointments/${appointmentId}`, data);
    return response.data;
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(request: RescheduleRequest): Promise<CalendarAppointment> {
    const response = await apiService.put<CalendarAppointment>(
      `/appointments/${request.appointment_id}/reschedule`,
      {
        new_date: request.new_date,
        new_start_time: request.new_start_time,
        new_staff_id: request.new_staff_id,
        send_notification: request.send_notification,
        reason: request.reason,
      }
    );
    return response.data;
  },

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(request: StatusUpdateRequest): Promise<CalendarAppointment> {
    const response = await apiService.put<CalendarAppointment>(
      `/appointments/${request.appointment_id}/status`,
      {
        status: request.status,
        notes: request.notes,
      }
    );
    return response.data;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string,
    sendNotification: boolean = true
  ): Promise<CalendarAppointment> {
    const response = await apiService.put<CalendarAppointment>(`/appointments/${appointmentId}/cancel`, {
      reason,
      send_notification: sendNotification,
    });
    return response.data;
  },

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    await apiService.delete(`/appointments/${appointmentId}`);
  },

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(params: {
    businessId: string;
    staffId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }): Promise<AppointmentConflict> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
      staff_id: params.staffId,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
    });

    if (params.excludeAppointmentId) {
      queryParams.append('exclude_appointment_id', params.excludeAppointmentId);
    }

    const response = await apiService.get<AppointmentConflict>(
      `/appointments/check-conflicts?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Search appointments
   */
  async searchAppointments(params: {
    businessId: string;
    query: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CalendarAppointment[]> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
      q: params.query,
    });

    if (params.startDate) {
      queryParams.append('start_date', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('end_date', params.endDate);
    }

    const response = await apiService.get<CalendarAppointment[]>(
      `/appointments/search?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get blocked times for staff
   */
  async getBlockedTimes(params: {
    businessId: string;
    staffId?: string;
    startDate: string;
    endDate: string;
  }): Promise<BlockedTime[]> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
      start_date: params.startDate,
      end_date: params.endDate,
    });

    if (params.staffId) {
      queryParams.append('staff_id', params.staffId);
    }

    const response = await apiService.get<BlockedTime[]>(`/blocked-time?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Create blocked time
   */
  async createBlockedTime(data: BlockedTimeFormData): Promise<BlockedTime> {
    const response = await apiService.post<BlockedTime>('/blocked-time', data);
    return response.data;
  },

  /**
   * Update blocked time
   */
  async updateBlockedTime(blockId: string, data: Partial<BlockedTimeFormData>): Promise<BlockedTime> {
    const response = await apiService.put<BlockedTime>(`/blocked-time/${blockId}`, data);
    return response.data;
  },

  /**
   * Delete blocked time
   */
  async deleteBlockedTime(blockId: string): Promise<void> {
    await apiService.delete(`/blocked-time/${blockId}`);
  },

  /**
   * Approve time-off request
   */
  async approveTimeOff(blockId: string): Promise<BlockedTime> {
    const response = await apiService.put<BlockedTime>(`/blocked-time/${blockId}/approve`, {});
    return response.data;
  },

  /**
   * Reject time-off request
   */
  async rejectTimeOff(blockId: string, reason?: string): Promise<BlockedTime> {
    const response = await apiService.put<BlockedTime>(`/blocked-time/${blockId}/reject`, { reason });
    return response.data;
  },

  /**
   * Search clients for appointment creation
   */
  async searchClients(params: {
    businessId: string;
    query: string;
    limit?: number;
  }): Promise<ClientSearchResult[]> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
      q: params.query,
      limit: (params.limit || 10).toString(),
    });

    const response = await apiService.get<ClientSearchResult[]>(`/clients/search?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get services for dropdown
   */
  async getServices(params: {
    businessId: string;
    locationId?: string;
    staffId?: string;
  }): Promise<ServiceOption[]> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
    });

    if (params.locationId) {
      queryParams.append('location_id', params.locationId);
    }
    if (params.staffId) {
      queryParams.append('staff_id', params.staffId);
    }

    const response = await apiService.get<ServiceOption[]>(`/services?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get staff for dropdown
   */
  async getStaff(params: {
    businessId: string;
    serviceId?: string;
    locationId?: string;
    date?: string;
    startTime?: string;
  }): Promise<StaffOption[]> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
    });

    if (params.serviceId) {
      queryParams.append('service_id', params.serviceId);
    }
    if (params.locationId) {
      queryParams.append('location_id', params.locationId);
    }
    if (params.date) {
      queryParams.append('date', params.date);
    }
    if (params.startTime) {
      queryParams.append('start_time', params.startTime);
    }

    const response = await apiService.get<StaffOption[]>(`/staff?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Export calendar data
   */
  async exportCalendar(options: CalendarExportOptions): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format: options.format,
      start_date: options.start_date,
      end_date: options.end_date,
    });

    if (options.staff_ids && options.staff_ids.length > 0) {
      options.staff_ids.forEach((id) => queryParams.append('staff_id', id));
    }

    if (options.include_cancelled !== undefined) {
      queryParams.append('include_cancelled', options.include_cancelled.toString());
    }

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/calendar/export?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * Get calendar metrics for dashboard
   */
  async getCalendarMetrics(params: {
    businessId: string;
    date: string; // YYYY-MM-DD for "today"
    staffId?: string;
  }): Promise<CalendarMetrics> {
    const queryParams = new URLSearchParams({
      business_id: params.businessId,
      date: params.date,
    });

    if (params.staffId) {
      queryParams.append('staff_id', params.staffId);
    }

    const response = await apiService.get<CalendarMetrics>(`/calendar/metrics?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Send appointment reminder
   */
  async sendReminder(appointmentId: string): Promise<void> {
    await apiService.post(`/appointments/${appointmentId}/send-reminder`, {});
  },

  /**
   * Bulk update appointment status
   */
  async bulkUpdateStatus(params: {
    appointmentIds: string[];
    status: string;
    notes?: string;
  }): Promise<{ updated: number }> {
    const response = await apiService.post<{ updated: number }>('/appointments/bulk-update-status', params);
    return response.data;
  },
};
