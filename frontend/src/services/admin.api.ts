// Admin API Service - Type-safe methods for admin operations
import { apiService } from './api.service';
import {
  Business,
  Location,
  Service,
  StaffMember,
  Client,
  ClientNote,
  AnalyticsMetrics,
  RevenueChartData,
  AppointmentVolumeData,
  TopService,
  TopStaff,
  ClientAcquisitionFunnel,
  AppointmentStatusBreakdown,
  NotificationSettings,
  Integration,
  BillingInfo,
  Invoice,
  StaffInvitation,
  CreateBusinessDto,
  UpdateBusinessDto,
  CreateLocationDto,
  CreateServiceDto,
  CreateClientDto,
  DateRangeFilter,
  ClientFilters,
  ServiceFilters,
  StaffFilters,
} from '@/types/admin.types';

// Business API
export const businessApi = {
  getBusiness: (businessId: string) =>
    apiService.get<Business>(`/businesses/${businessId}`),

  updateBusiness: (businessId: string, data: UpdateBusinessDto) =>
    apiService.put<Business>(`/businesses/${businessId}`, data),

  uploadLogo: async (businessId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/businesses/${businessId}/branding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    return response.json();
  },
};

// Location API
export const locationApi = {
  getLocations: (businessId: string) =>
    apiService.get<Location[]>(`/businesses/${businessId}/locations`),

  getLocation: (locationId: string) =>
    apiService.get<Location>(`/locations/${locationId}`),

  createLocation: (businessId: string, data: CreateLocationDto) =>
    apiService.post<Location>(`/businesses/${businessId}/locations`, data),

  updateLocation: (locationId: string, data: Partial<CreateLocationDto>) =>
    apiService.put<Location>(`/locations/${locationId}`, data),

  deleteLocation: (locationId: string) =>
    apiService.delete<void>(`/locations/${locationId}`),

  setLocationPrimary: (locationId: string) =>
    apiService.patch<Location>(`/locations/${locationId}/primary`, {}),
};

// Service API
export const serviceApi = {
  getServices: (businessId: string, filters?: ServiceFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.min_price) params.append('min_price', String(filters.min_price));
    if (filters?.max_price) params.append('max_price', String(filters.max_price));

    const query = params.toString();
    return apiService.get<Service[]>(`/businesses/${businessId}/services${query ? `?${query}` : ''}`);
  },

  getService: (serviceId: string) =>
    apiService.get<Service>(`/services/${serviceId}`),

  createService: (businessId: string, data: CreateServiceDto) =>
    apiService.post<Service>(`/businesses/${businessId}/services`, data),

  updateService: (serviceId: string, data: Partial<CreateServiceDto>) =>
    apiService.put<Service>(`/services/${serviceId}`, data),

  deleteService: (serviceId: string) =>
    apiService.delete<void>(`/services/${serviceId}`),

  duplicateService: (serviceId: string) =>
    apiService.post<Service>(`/services/${serviceId}/duplicate`, {}),

  bulkDeactivate: (serviceIds: string[]) =>
    apiService.post<void>('/services/bulk/deactivate', { service_ids: serviceIds }),
};

// Staff API
export const staffApi = {
  getStaffMembers: (businessId: string, filters?: StaffFilters) => {
    const params = new URLSearchParams();
    params.append('businessId', businessId);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location_id) params.append('location_id', filters.location_id);

    return apiService.get<StaffMember[]>(`/staff?${params.toString()}`);
  },

  getStaffMember: (staffId: string) =>
    apiService.get<StaffMember>(`/staff/${staffId}`),

  inviteStaff: (businessId: string, data: StaffInvitation) =>
    apiService.post<{ invitation_id: string }>(`/staff/invite`, { ...data, business_id: businessId }),

  updateStaff: (staffId: string, data: Partial<StaffMember>) =>
    apiService.put<StaffMember>(`/staff/${staffId}`, data),

  deleteStaff: (staffId: string) =>
    apiService.delete<void>(`/staff/${staffId}`),

  assignServices: (staffId: string, serviceIds: string[]) =>
    apiService.put<void>(`/staff/${staffId}/services`, { service_ids: serviceIds }),

  assignLocations: (staffId: string, locationIds: string[]) =>
    apiService.put<void>(`/staff/${staffId}/locations`, { location_ids: locationIds }),

  updatePermissions: (staffId: string, permissions: string[]) =>
    apiService.put<void>(`/staff/${staffId}/permissions`, { permissions }),
};

// Client API
export const clientApi = {
  getClients: (businessId: string, filters?: ClientFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.min_appointments) params.append('min_appointments', String(filters.min_appointments));
    if (filters?.max_appointments) params.append('max_appointments', String(filters.max_appointments));
    if (filters?.last_visit_start) params.append('last_visit_start', filters.last_visit_start);
    if (filters?.last_visit_end) params.append('last_visit_end', filters.last_visit_end);
    if (filters?.min_lifetime_value) params.append('min_lifetime_value', String(filters.min_lifetime_value));
    if (filters?.max_lifetime_value) params.append('max_lifetime_value', String(filters.max_lifetime_value));

    const query = params.toString();
    return apiService.get<Client[]>(`/businesses/${businessId}/clients${query ? `?${query}` : ''}`);
  },

  getClient: (clientId: string) =>
    apiService.get<Client>(`/clients/${clientId}`),

  createClient: (data: CreateClientDto) =>
    apiService.post<Client>('/clients', data),

  updateClient: (clientId: string, data: Partial<CreateClientDto>) =>
    apiService.put<Client>(`/clients/${clientId}`, data),

  getNotes: (clientId: string) =>
    apiService.get<ClientNote[]>(`/clients/${clientId}/notes`),

  addNote: (clientId: string, content: string) =>
    apiService.post<ClientNote>(`/clients/${clientId}/notes`, { content }),

  mergeClients: (sourceClientId: string, targetClientId: string, conflictResolution: Record<string, any>) =>
    apiService.post<Client>('/clients/merge', {
      source_client_id: sourceClientId,
      target_client_id: targetClientId,
      conflict_resolution: conflictResolution,
    }),

  exportClients: (businessId: string, fields: string[]) => {
    const params = new URLSearchParams();
    fields.forEach(field => params.append('fields', field));

    return fetch(`/api/businesses/${businessId}/clients/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    }).then(res => res.blob());
  },
};

// Analytics API
export const analyticsApi = {
  getMetrics: (businessId: string, dateRange: DateRangeFilter) =>
    apiService.get<AnalyticsMetrics>(
      `/businesses/${businessId}/analytics/metrics?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`
    ),

  getRevenueChart: (businessId: string, dateRange: DateRangeFilter, granularity: 'day' | 'week' | 'month') =>
    apiService.get<RevenueChartData[]>(
      `/businesses/${businessId}/analytics/revenue?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&granularity=${granularity}`
    ),

  getAppointmentVolume: (businessId: string, dateRange: DateRangeFilter, granularity: 'day' | 'week' | 'month') =>
    apiService.get<AppointmentVolumeData[]>(
      `/businesses/${businessId}/analytics/appointments?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&granularity=${granularity}`
    ),

  getTopServices: (businessId: string, dateRange: DateRangeFilter, limit: number = 5) =>
    apiService.get<TopService[]>(
      `/businesses/${businessId}/analytics/top-services?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&limit=${limit}`
    ),

  getTopStaff: (businessId: string, dateRange: DateRangeFilter, limit: number = 5) =>
    apiService.get<TopStaff[]>(
      `/businesses/${businessId}/analytics/top-staff?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&limit=${limit}`
    ),

  getClientAcquisition: (businessId: string, dateRange: DateRangeFilter) =>
    apiService.get<ClientAcquisitionFunnel>(
      `/businesses/${businessId}/analytics/client-acquisition?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`
    ),

  getAppointmentStatusBreakdown: (businessId: string, dateRange: DateRangeFilter) =>
    apiService.get<AppointmentStatusBreakdown>(
      `/businesses/${businessId}/analytics/appointment-status?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`
    ),

  getAverageBookingLeadTime: (businessId: string, dateRange: DateRangeFilter) =>
    apiService.get<{ average_lead_time_days: number }>(
      `/businesses/${businessId}/analytics/booking-lead-time?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`
    ),
};

// Settings API
export const settingsApi = {
  getNotificationSettings: (businessId: string) =>
    apiService.get<NotificationSettings>(`/businesses/${businessId}/settings/notifications`),

  updateNotificationSettings: (businessId: string, settings: NotificationSettings) =>
    apiService.put<NotificationSettings>(`/businesses/${businessId}/settings/notifications`, settings),

  getIntegrations: (businessId: string) =>
    apiService.get<Integration[]>(`/businesses/${businessId}/integrations`),

  connectIntegration: (provider: string, authCode: string) =>
    apiService.post<Integration>(`/integrations/${provider}/connect`, { auth_code: authCode }),

  disconnectIntegration: (integrationId: string) =>
    apiService.delete<void>(`/integrations/${integrationId}`),

  getBilling: (businessId: string) =>
    apiService.get<BillingInfo>(`/businesses/${businessId}/billing`),

  getInvoices: (businessId: string) =>
    apiService.get<Invoice[]>(`/businesses/${businessId}/billing/invoices`),

  updatePaymentMethod: (businessId: string, paymentMethodId: string) =>
    apiService.post<void>(`/businesses/${businessId}/billing/payment-method`, { payment_method_id: paymentMethodId }),
};
