import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingProvider, useBooking } from '../BookingContext';
import { bookingApi } from '@/services/booking.api';
import { BookingStep } from '@/types/booking.types';
import type { Business, Service, StaffMember, Location } from '@/types/booking.types';

// Mock booking API
jest.mock('@/services/booking.api');

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockBusiness: Business = {
  id: 'business-1',
  name: 'Test Salon',
  slug: 'test-salon',
  description: 'A test salon',
  settings: {
    allow_staff_selection: true,
    require_deposit: false,
    cancellation_hours: 24,
  },
};

const mockService: Service = {
  id: 'service-1',
  name: 'Haircut',
  description: 'Professional haircut',
  duration: 45,
  price: 50,
  category: 'Hair Services',
};

const mockStaff: StaffMember = {
  id: 'staff-1',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  avatar_url: '/avatars/jane.jpg',
  bio: 'Experienced stylist',
};

const mockLocation: Location = {
  id: 'location-1',
  name: 'Downtown Branch',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  postal_code: '94102',
  country: 'US',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = (businessId: string) => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BookingProvider businessId={businessId}>{children}</BookingProvider>
    </QueryClientProvider>
  );
};

describe('BookingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    (bookingApi.getBusinessPublic as jest.Mock).mockResolvedValue(mockBusiness);
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      expect(result.current.state.businessId).toBe('business-1');
      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);
      expect(result.current.state.serviceId).toBeNull();
      expect(result.current.state.staffId).toBeNull();
      expect(result.current.state.appointmentDate).toBeNull();
      expect(result.current.state.appointmentTime).toBeNull();
    });

    it('loads business data on mount', async () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      await waitFor(() => {
        expect(result.current.state.business).toEqual(mockBusiness);
      });

      expect(bookingApi.getBusinessPublic).toHaveBeenCalledWith('business-1');
    });

    it('restores state from sessionStorage', () => {
      const storedState = {
        businessId: 'business-1',
        serviceId: 'service-1',
        service: mockService,
        currentStep: BookingStep.DATE_TIME_SELECTION,
        completedSteps: [BookingStep.SERVICE_SELECTION],
      };

      mockSessionStorage.setItem('booking_state', JSON.stringify(storedState));

      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      expect(result.current.state.serviceId).toBe('service-1');
      expect(result.current.state.currentStep).toBe(BookingStep.DATE_TIME_SELECTION);
    });

    it('ignores sessionStorage for different business', () => {
      const storedState = {
        businessId: 'different-business',
        serviceId: 'service-1',
        currentStep: BookingStep.DATE_TIME_SELECTION,
      };

      mockSessionStorage.setItem('booking_state', JSON.stringify(storedState));

      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      expect(result.current.state.serviceId).toBeNull();
      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);
    });
  });

  describe('Service Selection', () => {
    it('selects service and updates state', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectService(mockService);
      });

      expect(result.current.state.serviceId).toBe('service-1');
      expect(result.current.state.service).toEqual(mockService);
      expect(result.current.state.completedSteps).toContain(BookingStep.SERVICE_SELECTION);
    });

    it('advances to staff selection when allowed', async () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      await waitFor(() => {
        expect(result.current.state.business).toBeDefined();
      });

      act(() => {
        result.current.actions.selectService(mockService);
      });

      expect(result.current.state.currentStep).toBe(BookingStep.STAFF_SELECTION);
    });

    it('skips to date/time selection when staff selection not allowed', async () => {
      const businessWithoutStaffSelection = {
        ...mockBusiness,
        settings: { ...mockBusiness.settings, allow_staff_selection: false },
      };
      (bookingApi.getBusinessPublic as jest.Mock).mockResolvedValue(businessWithoutStaffSelection);

      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      await waitFor(() => {
        expect(result.current.state.business).toBeDefined();
      });

      act(() => {
        result.current.actions.selectService(mockService);
      });

      expect(result.current.state.currentStep).toBe(BookingStep.DATE_TIME_SELECTION);
    });

    it('resets subsequent selections when service changes', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      // Set initial selections
      act(() => {
        result.current.actions.selectService(mockService);
        result.current.actions.selectStaff(mockStaff);
        result.current.actions.selectDate('2025-11-10');
        result.current.actions.selectTime('10:00');
      });

      // Change service
      const newService = { ...mockService, id: 'service-2', name: 'Hair Color' };
      act(() => {
        result.current.actions.selectService(newService);
      });

      // Subsequent selections should be reset
      expect(result.current.state.staffId).toBeNull();
      expect(result.current.state.appointmentDate).toBeNull();
      expect(result.current.state.appointmentTime).toBeNull();
    });
  });

  describe('Staff Selection', () => {
    it('selects staff and updates state', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectStaff(mockStaff);
      });

      expect(result.current.state.staffId).toBe('staff-1');
      expect(result.current.state.staff).toEqual(mockStaff);
      expect(result.current.state.currentStep).toBe(BookingStep.DATE_TIME_SELECTION);
      expect(result.current.state.completedSteps).toContain(BookingStep.STAFF_SELECTION);
    });

    it('allows selecting "first available" (null staff)', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectStaff(null);
      });

      expect(result.current.state.staffId).toBeNull();
      expect(result.current.state.staff).toBeNull();
      expect(result.current.state.currentStep).toBe(BookingStep.DATE_TIME_SELECTION);
    });

    it('resets date/time when staff changes', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      // Set initial selections
      act(() => {
        result.current.actions.selectStaff(mockStaff);
        result.current.actions.selectDate('2025-11-10');
        result.current.actions.selectTime('10:00');
      });

      // Change staff
      const newStaff = { ...mockStaff, id: 'staff-2', first_name: 'John' };
      act(() => {
        result.current.actions.selectStaff(newStaff);
      });

      expect(result.current.state.appointmentDate).toBeNull();
      expect(result.current.state.appointmentTime).toBeNull();
    });
  });

  describe('Date/Time Selection', () => {
    it('selects date and updates state', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectDate('2025-11-10');
      });

      expect(result.current.state.appointmentDate).toBe('2025-11-10');
    });

    it('selects time and marks step complete', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectTime('10:00');
      });

      expect(result.current.state.appointmentTime).toBe('10:00');
      expect(result.current.state.completedSteps).toContain(BookingStep.DATE_TIME_SELECTION);
    });

    it('resets time when date changes', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectDate('2025-11-10');
        result.current.actions.selectTime('10:00');
      });

      expect(result.current.state.appointmentTime).toBe('10:00');

      act(() => {
        result.current.actions.selectDate('2025-11-11');
      });

      expect(result.current.state.appointmentTime).toBeNull();
    });
  });

  describe('Client Info', () => {
    it('updates client info', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.updateClientInfo({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        });
      });

      expect(result.current.state.clientInfo.first_name).toBe('John');
      expect(result.current.state.clientInfo.last_name).toBe('Doe');
      expect(result.current.state.clientInfo.email).toBe('john@example.com');
      expect(result.current.state.clientInfo.phone).toBe('+1234567890');
    });

    it('merges partial client info updates', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.updateClientInfo({ first_name: 'John' });
      });

      expect(result.current.state.clientInfo.first_name).toBe('John');

      act(() => {
        result.current.actions.updateClientInfo({ last_name: 'Doe' });
      });

      expect(result.current.state.clientInfo.first_name).toBe('John');
      expect(result.current.state.clientInfo.last_name).toBe('Doe');
    });
  });

  describe('Step Navigation', () => {
    it('goes to specific step', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.goToStep(BookingStep.CLIENT_DETAILS);
      });

      expect(result.current.state.currentStep).toBe(BookingStep.CLIENT_DETAILS);
    });

    it('advances to next step', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);

      act(() => {
        result.current.actions.nextStep();
      });

      expect(result.current.state.currentStep).toBe(BookingStep.STAFF_SELECTION);
    });

    it('goes to previous step', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.goToStep(BookingStep.DATE_TIME_SELECTION);
      });

      act(() => {
        result.current.actions.previousStep();
      });

      expect(result.current.state.currentStep).toBe(BookingStep.STAFF_SELECTION);
    });

    it('does not go below first step', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);

      act(() => {
        result.current.actions.previousStep();
      });

      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);
    });

    it('does not go above last step', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.goToStep(BookingStep.CONFIRMATION);
      });

      act(() => {
        result.current.actions.nextStep();
      });

      expect(result.current.state.currentStep).toBe(BookingStep.CONFIRMATION);
    });
  });

  describe('Booking Confirmation', () => {
    const completeBookingData = {
      service: mockService,
      date: '2025-11-10',
      time: '10:00',
      clientInfo: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        sms_opt_in: true,
        accept_terms: true,
      },
    };

    const mockAppointment = {
      id: 'apt-1',
      appointment_number: 'APT-001',
      service_name: 'Haircut',
      start_time: '2025-11-10T10:00:00Z',
      status: 'pending',
    };

    beforeEach(() => {
      (bookingApi.createAppointment as jest.Mock).mockResolvedValue({
        appointment: mockAppointment,
      });
    });

    it('confirms booking with valid data', async () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      // Set up booking data
      act(() => {
        result.current.actions.selectService(completeBookingData.service);
        result.current.actions.selectDate(completeBookingData.date);
        result.current.actions.selectTime(completeBookingData.time);
        result.current.actions.updateClientInfo(completeBookingData.clientInfo);
      });

      // Confirm booking
      await act(async () => {
        await result.current.actions.confirmBooking();
      });

      expect(bookingApi.createAppointment).toHaveBeenCalledWith({
        service_id: 'service-1',
        staff_id: undefined,
        location_id: undefined,
        appointment_date: '2025-11-10',
        appointment_time: '10:00',
        client: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          notes: undefined,
        },
        sms_opt_in: true,
      });

      expect(result.current.state.confirmedAppointment).toEqual(mockAppointment);
      expect(result.current.state.currentStep).toBe(BookingStep.CONFIRMATION);
    });

    it('includes staff and location when selected', async () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.setLocation(mockLocation);
        result.current.actions.selectService(completeBookingData.service);
        result.current.actions.selectStaff(mockStaff);
        result.current.actions.selectDate(completeBookingData.date);
        result.current.actions.selectTime(completeBookingData.time);
        result.current.actions.updateClientInfo(completeBookingData.clientInfo);
      });

      await act(async () => {
        await result.current.actions.confirmBooking();
      });

      expect(bookingApi.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          staff_id: 'staff-1',
          location_id: 'location-1',
        })
      );
    });

    it('sets error when required fields are missing', async () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      // Missing required fields
      act(() => {
        result.current.actions.selectService(mockService);
      });

      await act(async () => {
        await result.current.actions.confirmBooking();
      });

      expect(result.current.error).toBe('Please complete all required fields');
      expect(bookingApi.createAppointment).not.toHaveBeenCalled();
    });

    it('handles API error gracefully', async () => {
      (bookingApi.createAppointment as jest.Mock).mockRejectedValue(
        new Error('Booking failed')
      );

      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectService(completeBookingData.service);
        result.current.actions.selectDate(completeBookingData.date);
        result.current.actions.selectTime(completeBookingData.time);
        result.current.actions.updateClientInfo(completeBookingData.clientInfo);
      });

      await act(async () => {
        await result.current.actions.confirmBooking();
      });

      expect(result.current.error).toBe('Booking failed');
      expect(result.current.state.confirmedAppointment).toBeNull();
    });
  });

  describe('Reset Booking', () => {
    it('resets state to initial values', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      // Set up booking data
      act(() => {
        result.current.actions.selectService(mockService);
        result.current.actions.selectDate('2025-11-10');
        result.current.actions.selectTime('10:00');
      });

      // Reset
      act(() => {
        result.current.actions.resetBooking();
      });

      expect(result.current.state.serviceId).toBeNull();
      expect(result.current.state.appointmentDate).toBeNull();
      expect(result.current.state.appointmentTime).toBeNull();
      expect(result.current.state.currentStep).toBe(BookingStep.SERVICE_SELECTION);
    });

    it('clears sessionStorage', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectService(mockService);
      });

      // Session storage should have data
      expect(mockSessionStorage.getItem('booking_state')).toBeTruthy();

      act(() => {
        result.current.actions.resetBooking();
      });

      // Session storage should be cleared
      expect(mockSessionStorage.getItem('booking_state')).toBeNull();
    });
  });

  describe('SessionStorage Persistence', () => {
    it('persists state to sessionStorage on updates', () => {
      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('business-1'),
      });

      act(() => {
        result.current.actions.selectService(mockService);
      });

      const stored = mockSessionStorage.getItem('booking_state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.serviceId).toBe('service-1');
    });
  });

  describe('Error Handling', () => {
    it('sets error when business loading fails', async () => {
      (bookingApi.getBusinessPublic as jest.Mock).mockRejectedValue(
        new Error('Business not found')
      );

      const { result } = renderHook(() => useBooking(), {
        wrapper: createWrapper('nonexistent-business'),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load business information');
      });
    });
  });

  describe('Hook Error', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useBooking());
      }).toThrow('useBooking must be used within a BookingProvider');

      console.error = originalError;
    });
  });
});
