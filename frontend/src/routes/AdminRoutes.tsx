import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Lazy-loaded pages for better performance and code splitting
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })));
const BusinessProfilePage = lazy(() => import('@/pages/admin/business/BusinessProfilePage').then(m => ({ default: m.BusinessProfilePage })));
const LocationListPage = lazy(() => import('@/pages/admin/locations/LocationListPage').then(m => ({ default: m.LocationListPage })));
const LocationDetailsPage = lazy(() => import('@/pages/admin/locations/LocationDetailsPage').then(m => ({ default: m.LocationDetailsPage })));
const ServiceListPage = lazy(() => import('@/pages/admin/services/ServiceListPage').then(m => ({ default: m.ServiceListPage })));
const ServiceDetailsPage = lazy(() => import('@/pages/admin/services/ServiceDetailsPage').then(m => ({ default: m.ServiceDetailsPage })));
const StaffListPage = lazy(() => import('@/pages/admin/staff/StaffListPage').then(m => ({ default: m.StaffListPage })));
const StaffDetailsPage = lazy(() => import('@/pages/admin/staff/StaffDetailsPage').then(m => ({ default: m.StaffDetailsPage })));
const ClientListPage = lazy(() => import('@/pages/admin/clients/ClientListPage').then(m => ({ default: m.ClientListPage })));
const ClientDetailsPage = lazy(() => import('@/pages/admin/clients/ClientDetailsPage').then(m => ({ default: m.ClientDetailsPage })));
const AppointmentListPage = lazy(() => import('@/pages/admin/appointments/AppointmentListPage').then(m => ({ default: m.AppointmentListPage })));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const AnalyticsPage = lazy(() => import('@/pages/admin/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/admin/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationSettingsPage = lazy(() => import('@/pages/admin/settings/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })));
const IntegrationSettingsPage = lazy(() => import('@/pages/admin/settings/IntegrationSettingsPage').then(m => ({ default: m.IntegrationSettingsPage })));
const BillingSettingsPage = lazy(() => import('@/pages/admin/settings/BillingSettingsPage').then(m => ({ default: m.BillingSettingsPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* Protected admin routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Business Profile */}
          <Route
            path="/business"
            element={
              <Suspense fallback={<PageLoader />}>
                <BusinessProfilePage />
              </Suspense>
            }
          />

          {/* Locations */}
          <Route
            path="/locations"
            element={
              <Suspense fallback={<PageLoader />}>
                <LocationListPage />
              </Suspense>
            }
          />
          <Route
            path="/locations/:locationId"
            element={
              <Suspense fallback={<PageLoader />}>
                <LocationDetailsPage />
              </Suspense>
            }
          />

          {/* Services */}
          <Route
            path="/services"
            element={
              <Suspense fallback={<PageLoader />}>
                <ServiceListPage />
              </Suspense>
            }
          />
          <Route
            path="/services/:serviceId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ServiceDetailsPage />
              </Suspense>
            }
          />

          {/* Staff */}
          <Route
            path="/staff"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffListPage />
              </Suspense>
            }
          />
          <Route
            path="/staff/:staffId"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffDetailsPage />
              </Suspense>
            }
          />

          {/* Clients */}
          <Route
            path="/clients"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClientListPage />
              </Suspense>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClientDetailsPage />
              </Suspense>
            }
          />

          {/* Appointments */}
          <Route
            path="/appointments"
            element={
              <Suspense fallback={<PageLoader />}>
                <AppointmentListPage />
              </Suspense>
            }
          />

          {/* Calendar */}
          <Route
            path="/calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <CalendarPage />
              </Suspense>
            }
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnalyticsPage />
              </Suspense>
            }
          />

          {/* Settings - nested routes */}
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          >
            <Route
              path="notifications"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotificationSettingsPage />
                </Suspense>
              }
            />
            <Route
              path="integrations"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IntegrationSettingsPage />
                </Suspense>
              }
            />
            <Route
              path="billing"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BillingSettingsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
