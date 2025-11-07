// Calendar Types and Interfaces

export type CalendarView = 'day' | 'week' | 'month' | 'resource';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BlockedTimeReason = 'break' | 'lunch' | 'time_off' | 'meeting' | 'holiday' | 'other';

// Appointment interface for calendar display
export interface CalendarAppointment {
  id: string;
  appointment_number: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  service_name: string;
  service_duration: number;
  staff_id: string;
  staff_name: string;
  staff_color?: string;
  location_id: string;
  location_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  status: AppointmentStatus;
  price: number;
  notes?: string;
  internal_notes?: string;
  payment_status?: 'unpaid' | 'paid' | 'refunded' | 'partial';
  created_at: string;
  updated_at: string;
}

// Blocked time for staff unavailability
export interface BlockedTime {
  id: string;
  staff_id: string;
  staff_name: string;
  reason: BlockedTimeReason;
  reason_text?: string;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  is_recurring: boolean;
  recurrence_rule?: string;
  status: 'active' | 'pending_approval' | 'cancelled';
  created_by: string;
  created_at: string;
}

// Staff member for calendar display
export interface CalendarStaff {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  color: string; // Hex color for calendar display
  is_active: boolean;
}

// Business hours for calendar constraints
export interface BusinessHours {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  is_open: boolean;
  open_time: string; // HH:mm:ss
  close_time: string; // HH:mm:ss
}

// Calendar data response
export interface CalendarData {
  appointments: CalendarAppointment[];
  blocked_times: BlockedTime[];
  staff_members: CalendarStaff[];
  business_hours: BusinessHours[];
  timezone: string;
}

// Calendar filters
export interface CalendarFilters {
  status: AppointmentStatus[];
  staff_ids: string[];
  service_ids: string[];
  location_ids: string[];
  search_query?: string;
}

// Calendar state
export interface CalendarState {
  currentView: CalendarView;
  currentDate: Date;
  selectedAppointmentId: string | null;
  selectedStaffIds: string[]; // For resource view
  filters: CalendarFilters;
  sidebarOpen: boolean;
  timezone: string;
}

// Calendar actions
export interface CalendarActions {
  setView: (view: CalendarView) => void;
  setDate: (date: Date) => void;
  nextPeriod: () => void;
  previousPeriod: () => void;
  goToToday: () => void;
  selectAppointment: (appointmentId: string | null) => void;
  toggleStaff: (staffId: string) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

// Appointment form data
export interface AppointmentFormData {
  client_id: string;
  service_id: string;
  staff_id: string;
  location_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  internal_notes?: string;
  status: AppointmentStatus;
  send_confirmation: boolean;
  price_override?: number;
}

// Quick create form data (simplified)
export interface QuickCreateFormData {
  client_id: string;
  service_id: string;
  staff_id: string;
  date: string;
  start_time: string;
  notes?: string;
}

// Reschedule request
export interface RescheduleRequest {
  appointment_id: string;
  new_date: string;
  new_start_time: string;
  new_staff_id?: string;
  send_notification: boolean;
  reason?: string;
}

// Status update request
export interface StatusUpdateRequest {
  appointment_id: string;
  status: AppointmentStatus;
  notes?: string;
}

// Blocked time form data
export interface BlockedTimeFormData {
  staff_id: string;
  reason: BlockedTimeReason;
  reason_text?: string;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  is_recurring: boolean;
  recurrence_rule?: string;
}

// Time slot for grid rendering
export interface TimeSlot {
  time: string; // HH:mm:ss
  label: string; // "8:00 AM"
  hour: number;
  minute: number;
}

// Calendar export options
export interface CalendarExportOptions {
  format: 'pdf' | 'csv' | 'ical';
  start_date: string;
  end_date: string;
  staff_ids?: string[];
  include_cancelled?: boolean;
}

// Drag-and-drop event
export interface AppointmentDragEvent {
  appointment: CalendarAppointment;
  original_start_time: string;
  original_staff_id: string;
  new_start_time: string;
  new_staff_id?: string;
  is_valid: boolean;
  conflict?: CalendarAppointment;
}

// Appointment conflict
export interface AppointmentConflict {
  has_conflict: boolean;
  conflicting_appointments: CalendarAppointment[];
  message: string;
}

// Calendar position calculation
export interface AppointmentPosition {
  top: number; // percentage
  height: number; // percentage
  left: number; // percentage for overlapping appointments
  width: number; // percentage for overlapping appointments
  zIndex: number;
}

// Client search result
export interface ClientSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  tier: 'new' | 'regular' | 'vip';
}

// Service option for dropdowns
export interface ServiceOption {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
}

// Staff option for dropdowns
export interface StaffOption {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  color: string;
  available: boolean;
}

// WebSocket event types
export interface CalendarWebSocketEvent {
  type:
    | 'appointment.created'
    | 'appointment.updated'
    | 'appointment.cancelled'
    | 'appointment.status_changed'
    | 'blocked_time.created'
    | 'blocked_time.updated'
    | 'user.viewing';
  data: any;
  timestamp: string;
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

// Calendar metrics
export interface CalendarMetrics {
  total_appointments: number;
  confirmed_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  utilization_percentage: number;
  revenue_today: number;
}
