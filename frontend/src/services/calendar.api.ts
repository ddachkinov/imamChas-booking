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
      business_id: params.businessId,
      view: params.view,
      start_date: params.startDate,
      end_date: params.endDate,
    });

    if (params.staffId) {
      queryParams.append('staff_id', params.staffId);
    }
    if (params.locationId) {
      queryParams.append('location_id', params.locationId);
    }
    if (params.status && params.status.length > 0) {
      params.status.forEach((s) => queryParams.append('status', s));
    }

    const response = await apiService.get<CalendarData>(`/calendar?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get single appointment details
   */
  async getAppointment(appointmentId: string): Promise<CalendarAppointment> {
    return await apiService.get<CalendarAppointment>(`/appointments/${appointmentId}`);
  },

  /**
   * Create new appointment
   */
  async createAppointment(data: AppointmentFormData): Promise<CalendarAppointment> {
    return await apiService.post<CalendarAppointment>('/appointments', data);
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
    return await apiService.post<CalendarAppointment>('/appointments', formData);
  },

  /**
   * Update existing appointment
   */
  async updateAppointment(
    appointmentId: string,
    data: Partial<AppointmentFormData>
  ): Promise<CalendarAppointment> {
    return await apiService.put<CalendarAppointment>(`/appointments/${appointmentId}`, data);
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(request: RescheduleRequest): Promise<CalendarAppointment> {
    return await apiService.put<CalendarAppointment>(
      `/appointments/${request.appointment_id}/reschedule`,
      {
        new_date: request.new_date,
        new_start_time: request.new_start_time,
        new_staff_id: request.new_staff_id,
        send_notification: request.send_notification,
        reason: request.reason,
      }
    );
  },

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(request: StatusUpdateRequest): Promise<CalendarAppointment> {
    return await apiService.put<CalendarAppointment>(
      `/appointments/${request.appointment_id}/status`,
      {
        status: request.status,
        notes: request.notes,
      }
    );
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string,
    sendNotification: boolean = true
  ): Promise<CalendarAppointment> {
    return await apiService.put<CalendarAppointment>(`/appointments/${appointmentId}/cancel`, {
      reason,
      send_notification: sendNotification,
    });
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

    return await apiService.get<AppointmentConflict>(
      `/appointments/check-conflicts?${queryParams.toString()}`
    );
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

    return await apiService.get<CalendarAppointment[]>(
      `/appointments/search?${queryParams.toString()}`
    );
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

    return await apiService.get<BlockedTime[]>(`/blocked-time?${queryParams.toString()}`);
  },

  /**
   * Create blocked time
   */
  async createBlockedTime(data: BlockedTimeFormData): Promise<BlockedTime> {
    return await apiService.post<BlockedTime>('/blocked-time', data);
  },

  /**
   * Update blocked time
   */
  async updateBlockedTime(blockId: string, data: Partial<BlockedTimeFormData>): Promise<BlockedTime> {
    return await apiService.put<BlockedTime>(`/blocked-time/${blockId}`, data);
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
    return await apiService.put<BlockedTime>(`/blocked-time/${blockId}/approve`, {});
  },

  /**
   * Reject time-off request
   */
  async rejectTimeOff(blockId: string, reason?: string): Promise<BlockedTime> {
    return await apiService.put<BlockedTime>(`/blocked-time/${blockId}/reject`, { reason });
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

    return await apiService.get<ClientSearchResult[]>(`/clients/search?${queryParams.toString()}`);
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

    return await apiService.get<ServiceOption[]>(`/services?${queryParams.toString()}`);
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

    return await apiService.get<StaffOption[]>(`/staff?${queryParams.toString()}`);
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

    return await apiService.get<CalendarMetrics>(`/calendar/metrics?${queryParams.toString()}`);
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
    return await apiService.post<{ updated: number }>('/appointments/bulk-update-status', params);
  },
};
