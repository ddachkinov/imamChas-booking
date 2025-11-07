import { apiService } from './api.service';
import type {
  Business,
  Service,
  Location,
  StaffMember,
  AvailabilityRequest,
  AvailabilityResponse,
  TimeSlotsRequest,
  TimeSlotsResponse,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from '@/types/booking.types';

export const bookingApi = {
  // Get public business information (no auth required)
  async getBusinessPublic(businessId: string): Promise<Business> {
    const response = await apiService.get<{ data: Business }>(
      `/public/businesses/${businessId}`
    );
    return response.data;
  },

  // Get business by slug (for custom URLs)
  async getBusinessBySlug(slug: string): Promise<Business> {
    const response = await apiService.get<{ data: Business }>(`/public/businesses/slug/${slug}`);
    return response.data;
  },

  // Get active locations for a business
  async getLocations(businessId: string): Promise<Location[]> {
    const response = await apiService.get<{ data: Location[] }>(
      `/public/businesses/${businessId}/locations`
    );
    return response.data;
  },

  // Get active services for a business/location
  async getServices(businessId: string, locationId?: string): Promise<Service[]> {
    const params = locationId ? { location_id: locationId } : {};
    const response = await apiService.get<{ data: Service[] }>(
      `/public/businesses/${businessId}/services`,
      { params }
    );
    return response.data;
  },

  // Get available staff for a service
  async getAvailableStaff(businessId: string, serviceId: string): Promise<StaffMember[]> {
    const response = await apiService.get<{ data: StaffMember[] }>(
      `/public/businesses/${businessId}/services/${serviceId}/staff`
    );
    return response.data;
  },

  // Get availability calendar (which days have slots)
  async getAvailability(businessId: string, request: AvailabilityRequest): Promise<AvailabilityResponse> {
    const response = await apiService.post<AvailabilityResponse>(
      `/public/businesses/${businessId}/availability`,
      request
    );
    return response;
  },

  // Get available time slots for a specific date
  async getTimeSlots(businessId: string, request: TimeSlotsRequest): Promise<TimeSlotsResponse> {
    const response = await apiService.post<TimeSlotsResponse>(
      `/public/businesses/${businessId}/timeslots`,
      request
    );
    return response;
  },

  // Create appointment (public endpoint)
  async createAppointment(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    const response = await apiService.post<CreateAppointmentResponse>(
      '/public/appointments',
      request
    );
    return response;
  },

  // Check if email is a returning customer
  async checkReturningCustomer(businessId: string, email: string): Promise<{
    is_returning: boolean;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }> {
    const response = await apiService.get<{
      is_returning: boolean;
      first_name?: string;
      last_name?: string;
      phone?: string;
    }>(`/public/businesses/${businessId}/check-customer`, {
      params: { email },
    });
    return response;
  },

  // Resend confirmation email
  async resendConfirmation(appointmentId: string): Promise<void> {
    await apiService.post(`/public/appointments/${appointmentId}/resend-confirmation`);
  },

  // Download ICS calendar file
  getIcsUrl(appointmentId: string): string {
    return `${apiService.baseURL}/public/appointments/${appointmentId}/calendar.ics`;
  },

  // Generate Google Calendar URL
  getGoogleCalendarUrl(appointment: {
    service_name: string;
    date: string;
    time: string;
    location_name: string;
    location_address: string;
  }): string {
    const { service_name, date, time, location_name, location_address } = appointment;

    // Format date and time for Google Calendar
    const dateTime = `${date}T${time}:00`;
    const startDate = new Date(dateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour default

    const formatGoogleDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: service_name,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Appointment for ${service_name}`,
      location: `${location_name}, ${location_address}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },
};
