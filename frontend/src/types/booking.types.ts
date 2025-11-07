// Booking UI Type Definitions

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  tagline?: string;
  description?: string;
  primary_color?: string;
  phone?: string;
  email?: string;
  timezone: string;
  settings: BusinessSettings;
}

export interface BusinessSettings {
  allow_staff_selection: boolean;
  require_payment_upfront: boolean;
  cancellation_hours: number;
  booking_advance_days: number;
}

export interface Location {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  phone: string;
  timezone: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration_minutes: number;
  price: number;
  currency: string;
  image_url?: string;
  is_popular?: boolean;
}

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
  is_soonest_available?: boolean;
}

export interface TimeSlot {
  time: string; // HH:mm format (e.g., "09:00", "14:30")
  available: boolean;
  staff_id?: string;
}

export interface AvailabilityDay {
  date: string; // ISO date string (YYYY-MM-DD)
  has_availability: boolean;
  is_fully_booked: boolean;
  slot_count: number;
}

export interface ClientInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
  sms_opt_in: boolean;
  accept_terms: boolean;
}

export interface BookingState {
  // Business context
  businessId: string;
  business: Business | null;

  // Selection state
  locationId: string | null;
  location: Location | null;
  serviceId: string | null;
  service: Service | null;
  staffId: string | null; // null means "first available"
  staff: StaffMember | null;
  appointmentDate: string | null; // ISO date string
  appointmentTime: string | null; // HH:mm format
  clientInfo: Partial<ClientInfo>;

  // Flow state
  currentStep: number; // 1-5
  completedSteps: number[]; // Array of completed step numbers

  // Booking result
  confirmedAppointment: ConfirmedAppointment | null;
}

export interface ConfirmedAppointment {
  id: string;
  appointment_number: string;
  service_name: string;
  staff_name: string;
  date: string;
  time: string;
  location_name: string;
  location_address: string;
  client_email: string;
  ics_url?: string;
  google_calendar_url?: string;
}

export interface BookingActions {
  // Business & Location
  setLocation: (location: Location) => void;

  // Service selection
  selectService: (service: Service) => void;

  // Staff selection
  selectStaff: (staff: StaffMember | null) => void; // null for "first available"

  // Date & Time
  selectDate: (date: string) => void;
  selectTime: (time: string) => void;

  // Client info
  updateClientInfo: (info: Partial<ClientInfo>) => void;

  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Booking
  confirmBooking: () => Promise<void>;

  // Reset
  resetBooking: () => void;
}

export enum BookingStep {
  SERVICE_SELECTION = 1,
  STAFF_SELECTION = 2,
  DATE_TIME_SELECTION = 3,
  CLIENT_DETAILS = 4,
  CONFIRMATION = 5,
}

export interface ServiceCategory {
  id: string;
  name: string;
  count: number;
}

export interface AvailabilityRequest {
  serviceId: string;
  staffId?: string;
  locationId?: string;
  startDate: string;
  endDate: string;
}

export interface AvailabilityResponse {
  days: AvailabilityDay[];
  timezone: string;
}

export interface TimeSlotsRequest {
  serviceId: string;
  staffId?: string;
  locationId?: string;
  date: string;
}

export interface TimeSlotsResponse {
  date: string;
  slots: TimeSlot[];
  timezone: string;
}

export interface CreateAppointmentRequest {
  service_id: string;
  staff_id?: string;
  location_id?: string;
  appointment_date: string;
  appointment_time: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes?: string;
  };
  sms_opt_in: boolean;
}

export interface CreateAppointmentResponse {
  appointment: ConfirmedAppointment;
}
