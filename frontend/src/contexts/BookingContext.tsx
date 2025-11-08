import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BookingState,
  BookingActions,
  Location,
  Service,
  StaffMember,
  ClientInfo,
  BookingStep,
} from '@/types/booking.types';
import { bookingApi } from '@/services/booking.api';

interface BookingContextType {
  state: BookingState;
  actions: BookingActions;
  isLoading: boolean;
  error: string | null;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const STORAGE_KEY = 'booking_state';

interface BookingProviderProps {
  businessId: string;
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ businessId, children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from session storage or defaults
  const getInitialState = (): BookingState => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.businessId === businessId) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse stored booking state', e);
        }
      }
    }

    return {
      businessId,
      business: null,
      locationId: null,
      location: null,
      serviceId: null,
      service: null,
      staffId: null,
      staff: null,
      appointmentDate: null,
      appointmentTime: null,
      clientInfo: {
        sms_opt_in: true,
        accept_terms: false,
      },
      currentStep: BookingStep.SERVICE_SELECTION,
      completedSteps: [],
      confirmedAppointment: null,
    };
  };

  const [state, setState] = useState<BookingState>(getInitialState);

  // Persist state to session storage
  useEffect(() => {
    if (typeof window !== 'undefined' && state.businessId) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Load business configuration
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        setIsLoading(true);
        const business = await bookingApi.getBusinessPublic(businessId);
        setState((prev) => ({ ...prev, business }));
      } catch (err) {
        setError('Failed to load business information');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId && !state.business) {
      loadBusiness();
    }
  }, [businessId, state.business]);

  const actions: BookingActions = {
    setLocation: (location: Location) => {
      setState((prev) => ({
        ...prev,
        locationId: location.id,
        location,
      }));
    },

    selectService: (service: Service) => {
      setState((prev) => ({
        ...prev,
        serviceId: service.id,
        service,
        // Reset subsequent selections when service changes
        staffId: null,
        staff: null,
        appointmentDate: null,
        appointmentTime: null,
        completedSteps: prev.completedSteps.includes(BookingStep.SERVICE_SELECTION)
          ? prev.completedSteps
          : [...prev.completedSteps, BookingStep.SERVICE_SELECTION],
      }));

      // Determine next step: staff selection or date/time
      if (state.business?.settings.allow_staff_selection) {
        setState((prev) => ({ ...prev, currentStep: BookingStep.STAFF_SELECTION }));
      } else {
        setState((prev) => ({ ...prev, currentStep: BookingStep.DATE_TIME_SELECTION }));
      }
    },

    selectStaff: (staff: StaffMember | null) => {
      setState((prev) => ({
        ...prev,
        staffId: staff?.id || null,
        staff,
        // Reset subsequent selections when staff changes
        appointmentDate: null,
        appointmentTime: null,
        completedSteps: prev.completedSteps.includes(BookingStep.STAFF_SELECTION)
          ? prev.completedSteps
          : [...prev.completedSteps, BookingStep.STAFF_SELECTION],
        currentStep: BookingStep.DATE_TIME_SELECTION,
      }));
    },

    selectDate: (date: string) => {
      setState((prev) => ({
        ...prev,
        appointmentDate: date,
        // Reset time when date changes
        appointmentTime: null,
      }));
    },

    selectTime: (time: string) => {
      setState((prev) => ({
        ...prev,
        appointmentTime: time,
        completedSteps: prev.completedSteps.includes(BookingStep.DATE_TIME_SELECTION)
          ? prev.completedSteps
          : [...prev.completedSteps, BookingStep.DATE_TIME_SELECTION],
      }));
    },

    updateClientInfo: (info: Partial<ClientInfo>) => {
      setState((prev) => ({
        ...prev,
        clientInfo: { ...prev.clientInfo, ...info },
      }));
    },

    goToStep: (step: number) => {
      setState((prev) => ({ ...prev, currentStep: step }));
    },

    nextStep: () => {
      setState((prev) => {
        const nextStep = prev.currentStep + 1;
        return {
          ...prev,
          currentStep: Math.min(nextStep, BookingStep.CONFIRMATION),
        };
      });
    },

    previousStep: () => {
      setState((prev) => {
        const prevStep = prev.currentStep - 1;
        return {
          ...prev,
          currentStep: Math.max(prevStep, BookingStep.SERVICE_SELECTION),
        };
      });
    },

    confirmBooking: async () => {
      if (
        !state.serviceId ||
        !state.appointmentDate ||
        !state.appointmentTime ||
        !state.clientInfo.first_name ||
        !state.clientInfo.last_name ||
        !state.clientInfo.email ||
        !state.clientInfo.phone
      ) {
        setError('Please complete all required fields');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const appointment = await bookingApi.createAppointment({
          service_id: state.serviceId,
          staff_id: state.staffId || undefined,
          location_id: state.locationId || undefined,
          appointment_date: state.appointmentDate,
          appointment_time: state.appointmentTime,
          client: {
            first_name: state.clientInfo.first_name,
            last_name: state.clientInfo.last_name,
            email: state.clientInfo.email,
            phone: state.clientInfo.phone,
            notes: state.clientInfo.notes,
          },
          sms_opt_in: state.clientInfo.sms_opt_in || false,
        });

        setState((prev) => ({
          ...prev,
          confirmedAppointment: appointment.appointment,
          currentStep: BookingStep.CONFIRMATION,
          completedSteps: [
            ...prev.completedSteps,
            BookingStep.CLIENT_DETAILS,
            BookingStep.CONFIRMATION,
          ],
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to create appointment');
        console.error('Booking error:', err);
      } finally {
        setIsLoading(false);
      }
    },

    resetBooking: () => {
      setState(getInitialState());
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    },
  };

  return (
    <BookingContext.Provider value={{ state, actions, isLoading, error }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
