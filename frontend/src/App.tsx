import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminRoutes } from '@/routes/AdminRoutes';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastStore } from '@/hooks/useToast';

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
            {/* Redirect root to admin dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* TODO: Add public booking routes */}
            {/* TODO: Add login/register routes */}
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
