/**
 * Analytics API Service
 * Handles all analytics and reporting data requests
 */

import { apiService } from './api.service';
import type {
  AnalyticsQuery,
  AnalyticsDashboard,
  AnalyticsOverview,
  RevenueByDay,
  RevenueByService,
  RevenueByStaff,
  AppointmentsByStatus,
  AppointmentsByService,
  AppointmentsByStaff,
  ClientAnalytics,
  TopService,
  TopStaff,
  TopClient,
  PeakHours,
  BookingSource,
  AnalyticsExportRequest,
} from '@/types/analytics.types';

/**
 * Get complete analytics dashboard data
 */
export const getAnalyticsDashboard = async (
  query: AnalyticsQuery
): Promise<AnalyticsDashboard> => {
  const response = await apiService.get<AnalyticsDashboard>('/analytics/dashboard', {
    params: query,
  });
  return response.data;
};

/**
 * Get analytics overview (key metrics)
 */
export const getAnalyticsOverview = async (
  query: AnalyticsQuery
): Promise<AnalyticsOverview> => {
  const response = await apiService.get<AnalyticsOverview>('/analytics/overview', {
    params: query,
  });
  return response.data;
};

/**
 * Get revenue by day (time series)
 */
export const getRevenueByDay = async (query: AnalyticsQuery): Promise<RevenueByDay> => {
  const response = await apiService.get<RevenueByDay>('/analytics/revenue/by-day', {
    params: query,
  });
  return response.data;
};

/**
 * Get revenue breakdown by service
 */
export const getRevenueByService = async (
  query: AnalyticsQuery
): Promise<RevenueByService[]> => {
  const response = await apiService.get<RevenueByService[]>('/analytics/revenue/by-service', {
    params: query,
  });
  return response.data;
};

/**
 * Get revenue breakdown by staff
 */
export const getRevenueByStaff = async (query: AnalyticsQuery): Promise<RevenueByStaff[]> => {
  const response = await apiService.get<RevenueByStaff[]>('/analytics/revenue/by-staff', {
    params: query,
  });
  return response.data;
};

/**
 * Get appointments by status
 */
export const getAppointmentsByStatus = async (
  query: AnalyticsQuery
): Promise<AppointmentsByStatus[]> => {
  const response = await apiService.get<AppointmentsByStatus[]>(
    '/analytics/appointments/by-status',
    {
      params: query,
    }
  );
  return response.data;
};

/**
 * Get appointments by service
 */
export const getAppointmentsByService = async (
  query: AnalyticsQuery
): Promise<AppointmentsByService[]> => {
  const response = await apiService.get<AppointmentsByService[]>(
    '/analytics/appointments/by-service',
    {
      params: query,
    }
  );
  return response.data;
};

/**
 * Get appointments by staff
 */
export const getAppointmentsByStaff = async (
  query: AnalyticsQuery
): Promise<AppointmentsByStaff[]> => {
  const response = await apiService.get<AppointmentsByStaff[]>(
    '/analytics/appointments/by-staff',
    {
      params: query,
    }
  );
  return response.data;
};

/**
 * Get client analytics
 */
export const getClientAnalytics = async (query: AnalyticsQuery): Promise<ClientAnalytics> => {
  const response = await apiService.get<ClientAnalytics>('/analytics/clients', {
    params: query,
  });
  return response.data;
};

/**
 * Get top services by performance
 */
export const getTopServices = async (
  query: AnalyticsQuery & { limit?: number }
): Promise<TopService[]> => {
  const response = await apiService.get<TopService[]>('/analytics/top/services', {
    params: query,
  });
  return response.data;
};

/**
 * Get top staff by performance
 */
export const getTopStaff = async (
  query: AnalyticsQuery & { limit?: number }
): Promise<TopStaff[]> => {
  const response = await apiService.get<TopStaff[]>('/analytics/top/staff', {
    params: query,
  });
  return response.data;
};

/**
 * Get top clients by spending
 */
export const getTopClients = async (
  query: AnalyticsQuery & { limit?: number }
): Promise<TopClient[]> => {
  const response = await apiService.get<TopClient[]>('/analytics/top/clients', {
    params: query,
  });
  return response.data;
};

/**
 * Get peak hours analysis
 */
export const getPeakHours = async (query: AnalyticsQuery): Promise<PeakHours[]> => {
  const response = await apiService.get<PeakHours[]>('/analytics/peak-hours', {
    params: query,
  });
  return response.data;
};

/**
 * Get booking sources breakdown
 */
export const getBookingSources = async (query: AnalyticsQuery): Promise<BookingSource[]> => {
  const response = await apiService.get<BookingSource[]>('/analytics/booking-sources', {
    params: query,
  });
  return response.data;
};

/**
 * Export analytics report
 */
export const exportAnalyticsReport = async (
  request: AnalyticsExportRequest
): Promise<Blob> => {
  const response = await apiService.post<Blob>('/analytics/export', request, {
    responseType: 'blob',
  });
  return response.data;
};

export const analyticsApi = {
  getAnalyticsDashboard,
  getAnalyticsOverview,
  getRevenueByDay,
  getRevenueByService,
  getRevenueByStaff,
  getAppointmentsByStatus,
  getAppointmentsByService,
  getAppointmentsByStaff,
  getClientAnalytics,
  getTopServices,
  getTopStaff,
  getTopClients,
  getPeakHours,
  getBookingSources,
  exportAnalyticsReport,
};
