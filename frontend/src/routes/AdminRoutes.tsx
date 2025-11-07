import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StaffRole } from '@/types/admin.types';

// Pages - will be created
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { BusinessProfilePage } from '@/pages/admin/business/BusinessProfilePage';
import { LocationListPage } from '@/pages/admin/locations/LocationListPage';
import { LocationDetailsPage } from '@/pages/admin/locations/LocationDetailsPage';
import { ServiceListPage } from '@/pages/admin/services/ServiceListPage';
import { ServiceDetailsPage } from '@/pages/admin/services/ServiceDetailsPage';
import { StaffListPage } from '@/pages/admin/staff/StaffListPage';
import { StaffDetailsPage } from '@/pages/admin/staff/StaffDetailsPage';
import { ClientListPage } from '@/pages/admin/clients/ClientListPage';
import { ClientDetailsPage } from '@/pages/admin/clients/ClientDetailsPage';
import { AppointmentListPage } from '@/pages/admin/appointments/AppointmentListPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { AnalyticsPage } from '@/pages/admin/analytics/AnalyticsPage';
import { SettingsPage } from '@/pages/admin/settings/SettingsPage';
import { NotificationSettingsPage } from '@/pages/admin/settings/NotificationSettingsPage';
import { IntegrationSettingsPage } from '@/pages/admin/settings/IntegrationSettingsPage';
import { BillingSettingsPage } from '@/pages/admin/settings/BillingSettingsPage';

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* Protected admin routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Business Profile */}
          <Route path="/business" element={<BusinessProfilePage />} />

          {/* Locations */}
          <Route path="/locations" element={<LocationListPage />} />
          <Route path="/locations/:locationId" element={<LocationDetailsPage />} />

          {/* Services */}
          <Route path="/services" element={<ServiceListPage />} />
          <Route path="/services/:serviceId" element={<ServiceDetailsPage />} />

          {/* Staff */}
          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/staff/:staffId" element={<StaffDetailsPage />} />

          {/* Clients */}
          <Route path="/clients" element={<ClientListPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailsPage />} />

          {/* Appointments */}
          <Route path="/appointments" element={<AppointmentListPage />} />

          {/* Calendar */}
          <Route path="/calendar" element={<CalendarPage />} />

          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Settings - nested routes */}
          <Route path="/settings" element={<SettingsPage />}>
            <Route path="notifications" element={<NotificationSettingsPage />} />
            <Route path="integrations" element={<IntegrationSettingsPage />} />
            <Route path="billing" element={<BillingSettingsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
