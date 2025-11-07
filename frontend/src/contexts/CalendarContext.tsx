import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';
import type {
  CalendarView,
  CalendarState,
  CalendarActions,
  CalendarFilters,
  AppointmentStatus,
} from '@/types/calendar.types';

interface CalendarContextType {
  state: CalendarState;
  actions: CalendarActions;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY = 'calendar-preferences';

// Load saved preferences
const loadPreferences = (): Partial<CalendarState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const prefs = JSON.parse(saved);
      return {
        currentView: prefs.currentView || 'week',
        selectedStaffIds: prefs.selectedStaffIds || [],
        timezone: prefs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  } catch (error) {
    console.error('Failed to load calendar preferences:', error);
  }
  return {
    currentView: 'week',
    selectedStaffIds: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

// Save preferences
const savePreferences = (state: CalendarState) => {
  try {
    const prefs = {
      currentView: state.currentView,
      selectedStaffIds: state.selectedStaffIds,
      timezone: state.timezone,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save calendar preferences:', error);
  }
};

// Initial state
const getInitialState = (): CalendarState => {
  const preferences = loadPreferences();
  return {
    currentView: preferences.currentView || 'week',
    currentDate: new Date(),
    selectedAppointmentId: null,
    selectedStaffIds: preferences.selectedStaffIds || [],
    filters: {
      status: [],
      staff_ids: [],
      service_ids: [],
      location_ids: [],
      search_query: '',
    },
    sidebarOpen: false,
    timezone: preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

interface CalendarProviderProps {
  children: React.ReactNode;
  businessId?: string;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children, businessId }) => {
  const [state, setState] = useState<CalendarState>(getInitialState);

  // Save preferences when view or staff selection changes
  useEffect(() => {
    savePreferences(state);
  }, [state.currentView, state.selectedStaffIds, state.timezone]);

  // Actions
  const actions: CalendarActions = {
    setView: useCallback((view: CalendarView) => {
      setState((prev) => ({ ...prev, currentView: view }));
    }, []),

    setDate: useCallback((date: Date) => {
      setState((prev) => ({ ...prev, currentDate: date }));
    }, []),

    nextPeriod: useCallback(() => {
      setState((prev) => {
        let newDate: Date;
        switch (prev.currentView) {
          case 'day':
            newDate = addDays(prev.currentDate, 1);
            break;
          case 'week':
            newDate = addWeeks(prev.currentDate, 1);
            break;
          case 'month':
            newDate = addMonths(prev.currentDate, 1);
            break;
          case 'resource':
            newDate = addDays(prev.currentDate, 1);
            break;
          default:
            newDate = prev.currentDate;
        }
        return { ...prev, currentDate: newDate };
      });
    }, []),

    previousPeriod: useCallback(() => {
      setState((prev) => {
        let newDate: Date;
        switch (prev.currentView) {
          case 'day':
            newDate = addDays(prev.currentDate, -1);
            break;
          case 'week':
            newDate = addWeeks(prev.currentDate, -1);
            break;
          case 'month':
            newDate = addMonths(prev.currentDate, -1);
            break;
          case 'resource':
            newDate = addDays(prev.currentDate, -1);
            break;
          default:
            newDate = prev.currentDate;
        }
        return { ...prev, currentDate: newDate };
      });
    }, []),

    goToToday: useCallback(() => {
      setState((prev) => ({ ...prev, currentDate: new Date() }));
    }, []),

    selectAppointment: useCallback((appointmentId: string | null) => {
      setState((prev) => ({
        ...prev,
        selectedAppointmentId: appointmentId,
        sidebarOpen: appointmentId !== null,
      }));
    }, []),

    toggleStaff: useCallback((staffId: string) => {
      setState((prev) => {
        const selectedStaffIds = prev.selectedStaffIds.includes(staffId)
          ? prev.selectedStaffIds.filter((id) => id !== staffId)
          : [...prev.selectedStaffIds, staffId];
        return { ...prev, selectedStaffIds };
      });
    }, []),

    setFilters: useCallback((filters: Partial<CalendarFilters>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
      }));
    }, []),

    clearFilters: useCallback(() => {
      setState((prev) => ({
        ...prev,
        filters: {
          status: [],
          staff_ids: [],
          service_ids: [],
          location_ids: [],
          search_query: '',
        },
      }));
    }, []),

    setSearchQuery: useCallback((query: string) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, search_query: query },
      }));
    }, []),

    openSidebar: useCallback(() => {
      setState((prev) => ({ ...prev, sidebarOpen: true }));
    }, []),

    closeSidebar: useCallback(() => {
      setState((prev) => ({
        ...prev,
        sidebarOpen: false,
        selectedAppointmentId: null,
      }));
    }, []),
  };

  return (
    <CalendarContext.Provider value={{ state, actions }}>
      {children}
    </CalendarContext.Provider>
  );
};

// Hook to use calendar context
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

// Helper functions for date calculations

/**
 * Get date range for current view and date
 */
export const getDateRange = (view: CalendarView, date: Date): { start: Date; end: Date } => {
  switch (view) {
    case 'day':
    case 'resource':
      return { start: date, end: date };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    default:
      return { start: date, end: date };
  }
};

/**
 * Format date range for display
 */
export const formatDateRange = (view: CalendarView, date: Date): string => {
  switch (view) {
    case 'day':
    case 'resource':
      return format(date, 'EEEE, MMMM d, yyyy');
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    case 'month':
      return format(date, 'MMMM yyyy');
    default:
      return format(date, 'MMMM d, yyyy');
  }
};

/**
 * Generate time slots for a day (e.g., 8 AM - 8 PM in 15-minute increments)
 */
export const generateTimeSlots = (
  startHour: number = 8,
  endHour: number = 20,
  intervalMinutes: number = 15
): { time: string; label: string; hour: number; minute: number }[] => {
  const slots: { time: string; label: string; hour: number; minute: number }[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    const iterations = hour === endHour ? 1 : 60 / intervalMinutes;
    for (let i = 0; i < iterations; i++) {
      const minute = i * intervalMinutes;
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

      slots.push({ time, label, hour, minute });
    }
  }

  return slots;
};

/**
 * Calculate appointment position for time grid
 * Returns top (percentage), height (percentage)
 */
export const calculateAppointmentPosition = (
  startTime: string, // HH:mm:ss
  endTime: string, // HH:mm:ss
  gridStartHour: number = 8,
  gridEndHour: number = 20
): { top: number; height: number } => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const totalMinutes = (gridEndHour - gridStartHour) * 60;
  const startMinutesFromGridStart = (startHour - gridStartHour) * 60 + startMinute;
  const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

  const top = (startMinutesFromGridStart / totalMinutes) * 100;
  const height = (durationMinutes / totalMinutes) * 100;

  return { top: Math.max(0, top), height: Math.max(0, height) };
};

/**
 * Check if two time ranges overlap
 */
export const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  return start1 < end2 && start2 < end1;
};

/**
 * Get status color for appointment
 */
export const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'confirmed':
      return 'bg-blue-500';
    case 'checked_in':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-purple-500';
    case 'completed':
      return 'bg-gray-400';
    case 'cancelled':
      return 'bg-red-500';
    case 'no_show':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'checked_in':
      return 'Checked In';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

/**
 * Filter appointments based on filters and search query
 */
export const filterAppointments = (
  appointments: any[],
  filters: CalendarFilters
): any[] => {
  return appointments.filter((apt) => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(apt.status)) {
      return false;
    }

    // Filter by staff
    if (filters.staff_ids.length > 0 && !filters.staff_ids.includes(apt.staff_id)) {
      return false;
    }

    // Filter by service
    if (filters.service_ids.length > 0 && !filters.service_ids.includes(apt.service_id)) {
      return false;
    }

    // Filter by search query
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      const matchesClient = apt.client_name.toLowerCase().includes(query);
      const matchesEmail = apt.client_email?.toLowerCase().includes(query);
      const matchesPhone = apt.client_phone?.toLowerCase().includes(query);
      const matchesService = apt.service_name.toLowerCase().includes(query);
      const matchesStaff = apt.staff_name?.toLowerCase().includes(query);
      const matchesNumber = apt.appointment_number?.toLowerCase().includes(query);

      if (!matchesClient && !matchesEmail && !matchesPhone && !matchesService && !matchesStaff && !matchesNumber) {
        return false;
      }
    }

    return true;
  });
};
