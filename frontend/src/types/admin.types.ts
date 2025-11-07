// Admin UI Type Definitions

export interface Business {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  timezone: string;
  business_type: BusinessType;
  logo_url?: string;
  primary_color?: string;
  subscription_tier?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export enum BusinessType {
  SALON = 'salon',
  SPA = 'spa',
  CLINIC = 'clinic',
  GYM = 'gym',
  CONSULTATION = 'consultation',
  OTHER = 'other',
}

export interface Location {
  id: string;
  tenant_id: string;
  business_id: string;
  name: string;
  address: Address;
  phone: string;
  email?: string;
  timezone: string;
  business_hours: BusinessHours[];
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BusinessHours {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  is_open: boolean;
  open_time?: string; // HH:mm format
  close_time?: string; // HH:mm format
}

export interface Service {
  id: string;
  tenant_id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  category: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_active: boolean;
  booking_restrictions?: BookingRestrictions;
  location_ids?: string[];
  staff_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface BookingRestrictions {
  min_advance_booking_minutes?: number;
  max_advance_booking_days?: number;
  min_cancellation_notice_hours?: number;
}

export interface StaffMember {
  id: string;
  tenant_id: string;
  business_id: string;
  user_id: string;
  user: User;
  role: StaffRole;
  permissions: string[];
  service_ids: string[];
  location_ids: string[];
  is_active: boolean;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
  stats?: StaffStats;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

export enum StaffRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
  RECEPTIONIST = 'receptionist',
}

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
}

export interface StaffStats {
  upcoming_appointments: number;
  completed_appointments: number;
  average_rating: number;
  total_revenue: number;
}

export interface Client {
  id: string;
  tenant_id: string;
  user_id: string;
  user: User;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  last_appointment_date?: string;
  lifetime_value: number;
  notes?: ClientNote[];
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  created_by: string;
  created_by_user?: User;
  created_at: string;
}

export interface AnalyticsMetrics {
  total_revenue: number;
  total_revenue_change: number;
  total_appointments: number;
  total_appointments_change: number;
  new_clients: number;
  new_clients_change: number;
  average_appointment_value: number;
  average_appointment_value_change: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface AppointmentVolumeData {
  date: string;
  count: number;
}

export interface TopService {
  service_id: string;
  service_name: string;
  revenue: number;
}

export interface TopStaff {
  staff_id: string;
  staff_name: string;
  appointment_count: number;
}

export interface ClientAcquisitionFunnel {
  new_clients: number;
  returning_clients: number;
  lapsed_clients: number;
}

export interface AppointmentStatusBreakdown {
  completed: number;
  cancelled: number;
  no_show: number;
  upcoming: number;
}

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  events: {
    new_booking: boolean;
    cancellation: boolean;
    reminder: boolean;
    review_request: boolean;
  };
}

export interface Integration {
  id: string;
  provider: string;
  name: string;
  is_connected: boolean;
  connected_at?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface BillingInfo {
  subscription_tier: string;
  feature_limits: Record<string, number>;
  feature_usage: Record<string, number>;
  payment_method?: PaymentMethod;
}

export interface PaymentMethod {
  type: 'card';
  last_four: string;
  exp_month: number;
  exp_year: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  issued_at: string;
  due_at: string;
  paid_at?: string;
  pdf_url?: string;
}

export interface StaffInvitation {
  email: string;
  role: StaffRole;
  service_ids?: string[];
  location_ids?: string[];
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  timezone: string;
  business_type: BusinessType;
}

export interface UpdateBusinessDto extends Partial<CreateBusinessDto> {
  primary_color?: string;
}

export interface CreateLocationDto {
  name: string;
  address: Address;
  phone: string;
  email?: string;
  timezone: string;
  business_hours: BusinessHours[];
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category: string;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  booking_restrictions?: BookingRestrictions;
}

export interface CreateClientDto {
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  notes?: string;
}

export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface ClientFilters {
  search?: string;
  min_appointments?: number;
  max_appointments?: number;
  last_visit_start?: string;
  last_visit_end?: string;
  min_lifetime_value?: number;
  max_lifetime_value?: number;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
}

export interface StaffFilters {
  role?: StaffRole;
  status?: StaffStatus;
  location_id?: string;
}
