# API Integration Guide

This guide covers how to integrate the frontend with the backend API, including authentication, data fetching, error handling, and best practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Client Setup](#api-client-setup)
3. [Authentication Flow](#authentication-flow)
4. [Data Fetching with React Query](#data-fetching-with-react-query)
5. [Error Handling](#error-handling)
6. [API Service Patterns](#api-service-patterns)
7. [Real-time Updates](#real-time-updates)
8. [File Uploads](#file-uploads)
9. [Testing API Integration](#testing-api-integration)
10. [Best Practices](#best-practices)

## Architecture Overview

The application uses a clean separation between frontend and backend:

```
Frontend (React + Vite)          Backend (NestJS)
Port: 3001                       Port: 3000
├── API Services                 ├── Controllers
├── React Query                  ├── Services
├── Auth Context                 ├── Repositories
└── UI Components                └── Database (PostgreSQL)
```

### Key Technologies

- **Axios**: HTTP client for API requests
- **React Query**: Server state management and caching
- **JWT**: Authentication tokens
- **WebSocket**: Real-time updates (Socket.io)
- **Zod**: Request/response validation

## API Client Setup

### Base Configuration

Create a configured axios instance with interceptors:

```typescript
// src/lib/api-client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('auth_token', access_token);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Environment Variables

Configure API endpoint in `.env`:

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

## Authentication Flow

### Login Process

```typescript
// src/services/auth.api.ts
import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, User } from '@/types/auth.types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    // Store tokens
    localStorage.setItem('auth_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
```

### Auth Context Integration

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/auth.api';
import type { User, LoginRequest } from '@/types/auth.types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user on mount
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem('auth_token'),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
    },
  });

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: async (credentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Data Fetching with React Query

### Basic Query Pattern

```typescript
// src/services/appointments.api.ts
import { apiClient } from '@/lib/api-client';
import type { Appointment, CreateAppointmentDto } from '@/types/appointment.types';

export const appointmentsApi = {
  // List appointments
  getAppointments: async (params: {
    business_id: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  // Get single appointment
  getAppointment: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  // Create appointment
  createAppointment: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (id: string, reason?: string): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/cancel`, {
      cancellation_reason: reason,
    });
    return response.data;
  },
};
```

### Using Queries in Components

```typescript
// src/pages/admin/appointments/AppointmentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/services/appointments.api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const businessId = user?.tenant_id || '';

  // Fetch appointments
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', businessId, { status: 'all' }],
    queryFn: () => appointmentsApi.getAppointments({
      business_id: businessId,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    }),
    enabled: !!businessId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancelAppointment(id, reason),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
      showToast('Appointment cancelled successfully', 'success');
    },
    onError: (error) => {
      showToast('Failed to cancel appointment', 'error');
      console.error('Cancel error:', error);
    },
  });

  const handleCancel = (appointmentId: string, reason?: string) => {
    cancelMutation.mutate({ id: appointmentId, reason });
  };

  // ... render logic
};
```

### Optimistic Updates

```typescript
// Optimistic update example
const updateAppointmentMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
    appointmentsApi.updateAppointment(id, data),

  // Optimistically update the cache
  onMutate: async ({ id, data }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['appointments'] });

    // Snapshot previous value
    const previousAppointments = queryClient.getQueryData(['appointments', businessId]);

    // Optimistically update
    queryClient.setQueryData(['appointments', businessId], (old: Appointment[]) =>
      old.map((apt) => (apt.id === id ? { ...apt, ...data } : apt))
    );

    return { previousAppointments };
  },

  // On error, roll back
  onError: (err, variables, context) => {
    if (context?.previousAppointments) {
      queryClient.setQueryData(['appointments', businessId], context.previousAppointments);
    }
    showToast('Failed to update appointment', 'error');
  },

  // Always refetch after success or error
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
  },
});
```

### Pagination Pattern

```typescript
// Paginated query
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['appointments', businessId, filters],
  queryFn: ({ pageParam = 1 }) =>
    appointmentsApi.getAppointments({
      business_id: businessId,
      page: pageParam,
      limit: 20,
      ...filters,
    }),
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.has_more ? allPages.length + 1 : undefined;
  },
  enabled: !!businessId,
});

// Load more button
<button
  onClick={() => fetchNextPage()}
  disabled={!hasNextPage || isFetchingNextPage}
>
  {isFetchingNextPage ? 'Loading...' : 'Load More'}
</button>
```

## Error Handling

### API Error Types

```typescript
// src/types/api.types.ts
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  validation_errors?: Record<string, string[]>;
}

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public validationErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}
```

### Global Error Handler

```typescript
// src/lib/error-handler.ts
import { AxiosError } from 'axios';
import type { ApiError } from '@/types/api.types';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;

    // Validation errors
    if (apiError?.validation_errors) {
      const firstError = Object.values(apiError.validation_errors)[0]?.[0];
      return firstError || 'Validation failed';
    }

    // Standard API errors
    if (apiError?.message) {
      return apiError.message;
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }

    // HTTP status errors
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict. This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  return 'An unexpected error occurred.';
};
```

### Using Error Handler in Components

```typescript
import { handleApiError } from '@/lib/error-handler';

const mutation = useMutation({
  mutationFn: appointmentsApi.createAppointment,
  onError: (error) => {
    const errorMessage = handleApiError(error);
    showToast(errorMessage, 'error');
  },
});
```

## API Service Patterns

### CRUD Service Template

```typescript
// Generic CRUD service template
export const createCrudApi = <T, CreateDto, UpdateDto>(basePath: string) => ({
  list: async (params?: Record<string, any>): Promise<T[]> => {
    const response = await apiClient.get<T[]>(basePath, { params });
    return response.data;
  },

  get: async (id: string): Promise<T> => {
    const response = await apiClient.get<T>(`${basePath}/${id}`);
    return response.data;
  },

  create: async (data: CreateDto): Promise<T> => {
    const response = await apiClient.post<T>(basePath, data);
    return response.data;
  },

  update: async (id: string, data: UpdateDto): Promise<T> => {
    const response = await apiClient.patch<T>(`${basePath}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${basePath}/${id}`);
  },
});

// Usage
export const servicesApi = createCrudApi<Service, CreateServiceDto, UpdateServiceDto>('/services');
export const staffApi = createCrudApi<Staff, CreateStaffDto, UpdateStaffDto>('/staff');
```

### Complex Query Service

```typescript
// src/services/analytics.api.ts
export const analyticsApi = {
  getAnalyticsOverview: async (query: AnalyticsQuery): Promise<AnalyticsOverview> => {
    const response = await apiClient.get<AnalyticsOverview>('/analytics/overview', {
      params: query,
    });
    return response.data;
  },

  getRevenueByDay: async (query: AnalyticsQuery): Promise<RevenueData> => {
    const response = await apiClient.get<RevenueData>('/analytics/revenue', {
      params: query,
    });
    return response.data;
  },

  getTopServices: async (query: AnalyticsQuery & { limit?: number }): Promise<TopService[]> => {
    const response = await apiClient.get<TopService[]>('/analytics/top-services', {
      params: query,
    });
    return response.data;
  },

  exportReport: async (query: AnalyticsQuery, format: 'csv' | 'pdf'): Promise<Blob> => {
    const response = await apiClient.get('/analytics/export', {
      params: { ...query, format },
      responseType: 'blob',
    });
    return response.data;
  },
};
```

## Real-time Updates

### WebSocket Setup

```typescript
// src/lib/websocket.ts
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export class WebSocketClient {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  unsubscribe(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const wsClient = new WebSocketClient();
```

### Using WebSocket in Components

```typescript
// src/hooks/useRealtimeAppointments.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from '@/lib/websocket';
import type { Appointment } from '@/types/appointment.types';

export const useRealtimeAppointments = (businessId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to appointment events
    const handleAppointmentCreated = (appointment: Appointment) => {
      queryClient.setQueryData(['appointments', businessId], (old: Appointment[] = []) => [
        ...old,
        appointment,
      ]);
    };

    const handleAppointmentUpdated = (appointment: Appointment) => {
      queryClient.setQueryData(['appointments', businessId], (old: Appointment[] = []) =>
        old.map((apt) => (apt.id === appointment.id ? appointment : apt))
      );
    };

    const handleAppointmentCancelled = (appointmentId: string) => {
      queryClient.setQueryData(['appointments', businessId], (old: Appointment[] = []) =>
        old.filter((apt) => apt.id !== appointmentId)
      );
    };

    wsClient.subscribe('appointment:created', handleAppointmentCreated);
    wsClient.subscribe('appointment:updated', handleAppointmentUpdated);
    wsClient.subscribe('appointment:cancelled', handleAppointmentCancelled);

    return () => {
      wsClient.unsubscribe('appointment:created', handleAppointmentCreated);
      wsClient.unsubscribe('appointment:updated', handleAppointmentUpdated);
      wsClient.unsubscribe('appointment:cancelled', handleAppointmentCancelled);
    };
  }, [businessId, queryClient]);
};

// Usage in component
export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const businessId = user?.tenant_id || '';

  // Enable real-time updates
  useRealtimeAppointments(businessId);

  // ... rest of component
};
```

## File Uploads

### Upload Service

```typescript
// src/services/upload.api.ts
export const uploadApi = {
  uploadFile: async (file: File, folder?: string): Promise<{ url: string; id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.post<{ url: string; id: string }>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    return uploadApi.uploadFile(file, 'avatars');
  },
};
```

### Upload Hook

```typescript
// src/hooks/useFileUpload.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '@/services/upload.api';
import { useToast } from './useToast';

export const useFileUpload = () => {
  const { showToast } = useToast();
  const [progress, setProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: uploadApi.uploadFile,
    onSuccess: () => {
      showToast('File uploaded successfully', 'success');
      setProgress(0);
    },
    onError: () => {
      showToast('Failed to upload file', 'error');
      setProgress(0);
    },
  });

  const upload = async (file: File, folder?: string) => {
    setProgress(0);

    // Simulate progress (in real implementation, use axios upload progress)
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await uploadMutation.mutateAsync(file, folder);
      setProgress(100);
      return result;
    } finally {
      clearInterval(interval);
    }
  };

  return {
    upload,
    isUploading: uploadMutation.isPending,
    progress,
  };
};
```

## Testing API Integration

### Mocking API Calls

```typescript
// src/services/__tests__/appointments.api.test.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { appointmentsApi } from '../appointments.api';

const server = setupServer(
  rest.get('/appointments', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          client_name: 'John Doe',
          service_name: 'Haircut',
          status: 'confirmed',
        },
      ])
    );
  }),

  rest.post('/appointments', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '2',
        ...req.body,
        status: 'pending',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('appointmentsApi', () => {
  it('fetches appointments', async () => {
    const appointments = await appointmentsApi.getAppointments({
      business_id: 'test',
    });

    expect(appointments).toHaveLength(1);
    expect(appointments[0].client_name).toBe('John Doe');
  });

  it('creates appointment', async () => {
    const newAppointment = await appointmentsApi.createAppointment({
      client_id: 'c1',
      service_id: 's1',
      staff_id: 'st1',
      start_time: '2025-11-10T10:00:00Z',
    });

    expect(newAppointment.id).toBe('2');
    expect(newAppointment.status).toBe('pending');
  });
});
```

### Testing React Query Integration

```typescript
// src/components/__tests__/AppointmentsList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { AppointmentsList } from '../AppointmentsList';

const server = setupServer(
  rest.get('/appointments', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', client_name: 'John Doe', status: 'confirmed' },
        { id: '2', client_name: 'Jane Smith', status: 'pending' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('AppointmentsList', () => {
  it('renders appointments from API', async () => {
    render(<AppointmentsList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<AppointmentsList />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. API Service Organization

```
src/services/
├── api-client.ts          # Base axios instance
├── auth.api.ts            # Authentication
├── appointments.api.ts    # Appointments
├── services.api.ts        # Services
├── staff.api.ts           # Staff
├── clients.api.ts         # Clients
├── analytics.api.ts       # Analytics
└── upload.api.ts          # File uploads
```

### 2. Type Safety

Always define types for requests and responses:

```typescript
// src/types/appointment.types.ts
export interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  // ... other fields
}

export interface CreateAppointmentDto {
  client_id: string;
  service_id: string;
  staff_id: string;
  start_time: string;
  notes?: string;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {
  status?: Appointment['status'];
}
```

### 3. Query Key Organization

Use consistent query key patterns:

```typescript
// Query key factory
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: AppointmentFilters) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: appointmentKeys.list({ business_id, status: 'confirmed' }),
  queryFn: () => appointmentsApi.getAppointments({ business_id, status: 'confirmed' }),
});
```

### 4. Error Boundaries

Wrap API-dependent components in error boundaries:

```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="mt-2 text-gray-600">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Request Cancellation

Cancel requests when components unmount:

```typescript
// React Query handles this automatically
const { data } = useQuery({
  queryKey: ['appointment', id],
  queryFn: async ({ signal }) => {
    const response = await apiClient.get(`/appointments/${id}`, { signal });
    return response.data;
  },
});
```

### 6. Rate Limiting and Retry Logic

Configure retry behavior:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 7. Cache Management

Implement smart cache invalidation:

```typescript
// Invalidate related queries after mutation
const createAppointmentMutation = useMutation({
  mutationFn: appointmentsApi.createAppointment,
  onSuccess: () => {
    // Invalidate appointment lists
    queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });

    // Invalidate calendar data
    queryClient.invalidateQueries({ queryKey: ['calendar'] });

    // Invalidate analytics (affected by new appointment)
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  },
});
```

### 8. Loading States

Provide granular loading feedback:

```typescript
const { data, isLoading, isFetching, isError } = useQuery({
  queryKey: ['appointments'],
  queryFn: appointmentsApi.getAppointments,
});

// isLoading: true on first load
// isFetching: true on background refetch
// Use isFetching for subtle loading indicator, isLoading for full page loader
```

### 9. Network Status Monitoring

Detect offline state:

```typescript
// src/hooks/useOnlineStatus.ts
import { useEffect, useState } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Show offline banner
const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-center">
      You are currently offline. Some features may be unavailable.
    </div>
  );
};
```

### 10. Request Deduplication

React Query automatically deduplicates identical requests made at the same time, but you can also manually deduplicate:

```typescript
// Use the same query key to deduplicate
// Multiple components using this query will share the same request
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.getUser(userId),
});
```

## Common Patterns

### Search with Debouncing

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch] = useDebounce(searchTerm, 500);

const { data: results } = useQuery({
  queryKey: ['search', debouncedSearch],
  queryFn: () => searchApi.search(debouncedSearch),
  enabled: debouncedSearch.length >= 3,
});
```

### Dependent Queries

```typescript
// Fetch user, then fetch their appointments
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.getUser(userId),
});

const { data: appointments } = useQuery({
  queryKey: ['appointments', user?.id],
  queryFn: () => appointmentsApi.getAppointments({ client_id: user!.id }),
  enabled: !!user,
});
```

### Parallel Queries

```typescript
// Fetch multiple resources in parallel
const queries = useQueries({
  queries: [
    {
      queryKey: ['services'],
      queryFn: servicesApi.getServices,
    },
    {
      queryKey: ['staff'],
      queryFn: staffApi.getStaff,
    },
    {
      queryKey: ['locations'],
      queryFn: locationsApi.getLocations,
    },
  ],
});

const [servicesQuery, staffQuery, locationsQuery] = queries;
const isLoading = queries.some((q) => q.isLoading);
```

## Troubleshooting

### CORS Issues

If you see CORS errors in development:

```typescript
// Backend (NestJS) - Enable CORS
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
});

// Frontend - Send credentials
apiClient.defaults.withCredentials = true;
```

### Token Refresh Loop

If token refresh causes infinite loops:

```typescript
// Add _retry flag to prevent infinite refresh attempts
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  // ... refresh logic
}
```

### Stale Data

If data seems outdated:

```typescript
// Reduce staleTime or enable refetchOnWindowFocus
const { data } = useQuery({
  queryKey: ['appointments'],
  queryFn: appointmentsApi.getAppointments,
  staleTime: 0, // Always consider stale
  refetchOnWindowFocus: true, // Refetch on window focus
});
```

### Memory Leaks

If you see "Can't perform a React state update on an unmounted component":

```typescript
// React Query handles cleanup automatically
// But for manual cleanup:
useEffect(() => {
  let isMounted = true;

  fetchData().then((data) => {
    if (isMounted) {
      setData(data);
    }
  });

  return () => {
    isMounted = false;
  };
}, []);
```

## Conclusion

This guide covers the core patterns for integrating the frontend with the backend API. Key takeaways:

1. Use axios with interceptors for all HTTP requests
2. Leverage React Query for server state management
3. Implement proper error handling and user feedback
4. Use TypeScript for type safety
5. Follow consistent patterns for API services
6. Test API integration thoroughly
7. Monitor network status and handle offline scenarios
8. Implement optimistic updates for better UX
9. Use WebSocket for real-time features
10. Cache aggressively but invalidate smartly

For more information, see:
- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [NestJS Documentation](https://docs.nestjs.com/)
