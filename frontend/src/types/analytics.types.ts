/**
 * Analytics Types
 * Type definitions for analytics and reporting data
 */

export type DateRangePreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRange {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  preset?: DateRangePreset;
}

export interface AnalyticsOverview {
  total_revenue: number;
  revenue_change: number; // Percentage change from previous period
  total_appointments: number;
  appointments_change: number;
  completed_appointments: number;
  completion_rate: number;
  cancelled_appointments: number;
  cancellation_rate: number;
  no_show_appointments: number;
  no_show_rate: number;
  new_clients: number;
  new_clients_change: number;
  returning_clients: number;
  total_clients: number;
  average_appointment_value: number;
  average_appointment_duration: number; // in minutes
}

export interface RevenueDataPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  appointments: number;
}

export interface RevenueByDay {
  data_points: RevenueDataPoint[];
  total_revenue: number;
  average_daily_revenue: number;
}

export interface RevenueByService {
  service_id: string;
  service_name: string;
  total_revenue: number;
  appointment_count: number;
  percentage_of_total: number;
}

export interface RevenueByStaff {
  staff_id: string;
  staff_name: string;
  total_revenue: number;
  appointment_count: number;
  average_appointment_value: number;
  percentage_of_total: number;
}

export interface AppointmentsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface AppointmentsByService {
  service_id: string;
  service_name: string;
  appointment_count: number;
  completed_count: number;
  cancelled_count: number;
  revenue: number;
  average_duration: number;
}

export interface AppointmentsByStaff {
  staff_id: string;
  staff_name: string;
  appointment_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  completion_rate: number;
  cancellation_rate: number;
  no_show_rate: number;
  total_hours_booked: number;
  revenue: number;
}

export interface ClientAnalytics {
  new_clients: number;
  returning_clients: number;
  total_clients: number;
  retention_rate: number;
  average_lifetime_value: number;
  average_appointments_per_client: number;
}

export interface TopService {
  service_id: string;
  service_name: string;
  appointment_count: number;
  revenue: number;
  completion_rate: number;
}

export interface TopStaff {
  staff_id: string;
  staff_name: string;
  appointment_count: number;
  revenue: number;
  average_rating?: number;
  completion_rate: number;
}

export interface TopClient {
  client_id: string;
  client_name: string;
  client_email?: string;
  appointment_count: number;
  total_spent: number;
  last_appointment_date: string;
}

export interface PeakHours {
  hour: number; // 0-23
  appointment_count: number;
  revenue: number;
}

export interface BookingSource {
  source: 'online' | 'phone' | 'walk_in' | 'admin' | 'other';
  appointment_count: number;
  percentage: number;
}

/**
 * Complete Analytics Dashboard Data
 */
export interface AnalyticsDashboard {
  overview: AnalyticsOverview;
  revenue_by_day: RevenueByDay;
  revenue_by_service: RevenueByService[];
  revenue_by_staff: RevenueByStaff[];
  appointments_by_status: AppointmentsByStatus[];
  appointments_by_service: AppointmentsByService[];
  appointments_by_staff: AppointmentsByStaff[];
  client_analytics: ClientAnalytics;
  top_services: TopService[];
  top_staff: TopStaff[];
  top_clients: TopClient[];
  peak_hours: PeakHours[];
  booking_sources: BookingSource[];
}

/**
 * Analytics Query Parameters
 */
export interface AnalyticsQuery {
  business_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  location_ids?: string[];
  service_ids?: string[];
  staff_ids?: string[];
  compare_to_previous?: boolean;
}

/**
 * Export Options
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface AnalyticsExportRequest {
  business_id: string;
  report_type: 'overview' | 'revenue' | 'appointments' | 'clients' | 'staff' | 'services';
  start_date: string;
  end_date: string;
  format: ExportFormat;
  include_charts?: boolean;
}
