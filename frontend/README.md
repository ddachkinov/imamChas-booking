# Booking Platform - Frontend

A modern, full-featured booking platform frontend built with React, TypeScript, and Vite.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Styling](#styling)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

This is the frontend application for a comprehensive booking management platform. It provides three main interfaces:

1. **Admin Dashboard** - Full business management for staff and administrators
2. **Customer Booking UI** - Public-facing booking wizard for end customers
3. **Calendar Management** - Advanced appointment scheduling and management

## Tech Stack

### Core

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing

### State Management

- **React Query (TanStack Query)** - Server state management
- **React Context** - UI state management
- **LocalStorage** - State persistence

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Icon library
- **Recharts** - Charting library

### Forms & Validation

- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Utilities

- **date-fns** - Date manipulation and formatting
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── auth/       # Authentication components
│   │   ├── error/      # Error boundaries and fallbacks
│   │   ├── layout/     # Layout components (header, footer, etc.)
│   │   └── ui/         # UI primitives (Button, Input, Modal, etc.)
│   ├── contexts/       # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── BookingContext.tsx
│   │   └── CalendarContext.tsx
│   ├── hooks/          # Custom React hooks
│   │   └── useToast.tsx
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin dashboard pages
│   │   │   ├── analytics/
│   │   │   ├── appointments/
│   │   │   ├── business/
│   │   │   ├── clients/
│   │   │   ├── locations/
│   │   │   ├── services/
│   │   │   ├── settings/
│   │   │   └── staff/
│   │   ├── booking/    # Customer booking wizard
│   │   └── calendar/   # Calendar and scheduling
│   ├── routes/         # Route configurations
│   ├── services/       # API service layers
│   │   ├── api.service.ts        # Base API client
│   │   ├── admin.api.ts          # Admin operations
│   │   ├── analytics.api.ts      # Analytics data
│   │   ├── auth.api.ts           # Authentication
│   │   ├── booking.api.ts        # Public booking
│   │   └── calendar.api.ts       # Calendar operations
│   ├── types/          # TypeScript type definitions
│   │   ├── admin.types.ts
│   │   ├── analytics.types.ts
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── booking.types.ts
│   │   └── calendar.types.ts
│   ├── utils/          # Utility functions
│   │   └── export.utils.ts
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Features

### Admin Dashboard

- **Dashboard** - Key metrics, charts, and insights
- **Business Profile** - Manage business information and branding
- **Locations** - Multi-location support with business hours
- **Services** - Service catalog with pricing and durations
- **Staff Management** - Staff profiles, availability, permissions
- **Client Database** - Client profiles, notes, history
- **Appointments** - List and detail views with filtering
- **Calendar** - Day/Week/Month views with drag-and-drop (planned)
- **Analytics** - Revenue tracking, performance metrics, top performers
- **Settings** - Notifications, integrations, billing

### Customer Booking

- **Service Selection** - Browse services by category
- **Staff Selection** - Choose specific staff or "First Available"
- **Date/Time Selection** - Calendar with real-time availability
- **Client Details** - Contact information with validation
- **Confirmation** - Booking summary with calendar export

### Calendar Management

- **Multiple Views** - Day, Week, Month, and List views
- **Appointment Management** - Create, update, cancel, reschedule
- **Status Workflow** - Pending → Confirmed → Checked In → In Progress → Completed
- **Filters & Search** - Filter by status, staff, service; search clients
- **Quick Create** - Fast appointment creation modal
- **Keyboard Shortcuts** - Power user navigation (←/→/T/D/W/M/N/F/Esc)
- **Metrics Widget** - Daily appointment and revenue metrics
- **Export** - iCal, CSV, and print functionality

### UI Components

- **Skeleton Loaders** - 15+ loading state components
- **Error Boundaries** - Graceful error handling
- **Toast Notifications** - User feedback system
- **Modals & Dialogs** - Accessible modal components
- **Forms** - Validated form components
- **Buttons** - Multiple variants and sizes
- **Badges** - Status indicators
- **Cards** - Content containers

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (optional for development with mock data)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd booking-platform/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure environment variables
# Edit .env and set VITE_API_BASE_URL
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Development Server

```bash
# Start development server
npm run dev

# Server will start at http://localhost:3001
```

### Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Conventions** - Follow existing patterns

### Naming Conventions

- **Components** - PascalCase (e.g., `UserProfile.tsx`)
- **Hooks** - camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Services** - camelCase with `.api.ts` suffix (e.g., `calendar.api.ts`)
- **Types** - PascalCase with `.types.ts` suffix (e.g., `booking.types.ts`)
- **Utils** - camelCase with `.utils.ts` suffix (e.g., `export.utils.ts`)

### Component Structure

```tsx
// Import order: React → Third-party → Local → Types
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/auth.types';

// Interface for props
interface ComponentProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// Component definition
export const Component: React.FC<ComponentProps> = ({ userId, onUpdate }) => {
  // Hooks
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Query
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Handlers
  const handleSubmit = () => {
    // Implementation
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Adding New Features

1. **Create Types** - Define TypeScript interfaces in `types/`
2. **Create API Service** - Add API methods in `services/`
3. **Create Components** - Build UI components in `components/` or `pages/`
4. **Add Routes** - Configure routes in `routes/`
5. **Test** - Test the feature manually (automated tests planned)

### State Management Patterns

#### Server State (React Query)

Use React Query for all server data:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => userApi.getUser(userId),
  staleTime: 60000, // 1 minute
});
```

#### UI State (Context)

Use React Context for shared UI state:

```tsx
// Create context
export const UIContext = createContext<UIContextValue>(null);

// Use in component
const { theme, setTheme } = useContext(UIContext);
```

#### Local State (useState)

Use local state for component-specific state:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

## Architecture

### Authentication Flow

1. User logs in via `/login`
2. Backend returns JWT access token and refresh token
3. Tokens stored in localStorage
4. API service adds `Authorization: Bearer <token>` header
5. Protected routes check authentication status
6. Token refresh handled automatically on 401 responses

### Data Flow

1. **Component** calls API service method
2. **API Service** makes HTTP request via axios
3. **Backend** processes request and returns data
4. **React Query** caches response
5. **Component** receives data and renders UI

### Error Handling

- **API Errors** - Caught by axios interceptor, displayed as toast
- **Component Errors** - Caught by ErrorBoundary, shows fallback UI
- **Validation Errors** - Displayed inline in forms

## API Integration

### API Service Layer

All API calls go through service layer:

```tsx
// services/user.api.ts
export const userApi = {
  getUser: (id: string) => apiService.get<User>(`/users/${id}`),
  updateUser: (id: string, data: UpdateUserDto) =>
    apiService.put<User>(`/users/${id}`, data),
};
```

### Request/Response Types

All API methods are fully typed:

```tsx
interface GetUserResponse {
  success: boolean;
  data: User;
  message?: string;
}
```

### Error Handling

```tsx
try {
  const user = await userApi.getUser(id);
} catch (error) {
  if (error.response?.status === 404) {
    // Handle not found
  }
  // Other errors handled by interceptor
}
```

## State Management

### React Query Configuration

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Cache Invalidation

```tsx
// After mutation, invalidate related queries
queryClient.invalidateQueries({ queryKey: ['users'] });
```

## Styling

### Tailwind CSS

Utility-first approach:

```tsx
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### Custom Colors

Defined in `tailwind.config.js`:

```js
colors: {
  primary: {
    50: '#f0f9ff',
    // ... more shades
    600: '#6366f1',
  },
}
```

### Responsive Design

Mobile-first approach:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Responsive grid */}
</div>
```

## Testing

### Unit Tests (Planned)

```bash
npm run test
```

### E2E Tests (Planned)

```bash
npm run test:e2e
```

## Deployment

### Production Build

```bash
npm run build
# Output: dist/
```

### Deploy to Netlify/Vercel

1. Connect Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

- **Code Splitting** - Lazy loading for routes
- **Image Optimization** - Optimized images
- **Bundle Analysis** - `npm run build -- --analyze`
- **Caching** - React Query cache configuration
- **Memoization** - React.memo for expensive components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.
