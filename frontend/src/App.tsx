import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminRoutes } from '@/routes/AdminRoutes';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastStore } from '@/hooks/useToast';

// Lazy-loaded booking pages for better performance
const BookingPage = lazy(() => import('@/pages/booking/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingBySlugPage = lazy(() => import('@/pages/booking/BookingBySlugPage').then(m => ({ default: m.BookingBySlugPage })));

// Lazy-loaded auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));

// Lazy-loaded landing page
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));

// Public pages (Studio24-inspired redesign)
const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage').then(m => ({ default: m.PublicHomePage })));
const StudioProfilePage = lazy(() => import('@/pages/public/StudioProfilePage').then(m => ({ default: m.StudioProfilePage })));
const PublicBookingWizard = lazy(() => import('@/pages/public/PublicBookingWizard').then(m => ({ default: m.PublicBookingWizard })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { toasts, removeToast } = useToastStore();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* New Public Homepage (Studio24-inspired) */}
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PublicHomePage />
                </Suspense>
              }
            />

            {/* Studio Profile Page */}
            <Route
              path="/studios/:slug"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StudioProfilePage />
                </Suspense>
              }
            />

            {/* Public Booking Wizard */}
            <Route
              path="/studios/:slug/booking"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PublicBookingWizard />
                </Suspense>
              }
            />

            {/* Auth routes */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LoginPage />
                </Suspense>
              }
            />

            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* Legacy routes (keep for backward compatibility) */}
            <Route
              path="/old-landing"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LandingPage />
                </Suspense>
              }
            />
            <Route
              path="/book/:businessId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BookingPage />
                </Suspense>
              }
            />
            <Route
              path="/b/:slug"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BookingBySlugPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* React Query Devtools */}
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
