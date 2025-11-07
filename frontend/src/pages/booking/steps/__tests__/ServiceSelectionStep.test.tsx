import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceSelectionStep } from '../ServiceSelectionStep';
import { BookingProvider } from '@/contexts/BookingContext';
import type { Service, ServiceCategory } from '@/types/booking.types';

// Mock services data
const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Haircut',
    description: 'Professional haircut and styling',
    duration: 45,
    price: 50,
    category: 'Hair Services',
    image_url: '/images/haircut.jpg',
  },
  {
    id: 's2',
    name: 'Hair Color',
    description: 'Full color treatment',
    duration: 120,
    price: 120,
    category: 'Hair Services',
    image_url: '/images/color.jpg',
  },
  {
    id: 's3',
    name: 'Manicure',
    description: 'Classic manicure',
    duration: 30,
    price: 35,
    category: 'Nail Services',
    image_url: '/images/manicure.jpg',
  },
];

const mockCategories: ServiceCategory[] = [
  { id: 'c1', name: 'Hair Services', service_count: 2 },
  { id: 'c2', name: 'Nail Services', service_count: 1 },
];

// Mock booking API
jest.mock('@/services/booking.api', () => ({
  bookingApi: {
    getServices: jest.fn(() => Promise.resolve(mockServices)),
    getCategories: jest.fn(() => Promise.resolve(mockCategories)),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BookingProvider businessId="test-business">
        {component}
      </BookingProvider>
    </QueryClientProvider>
  );
};

describe('ServiceSelectionStep', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service selection step', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    expect(screen.getByText('Select a Service')).toBeInTheDocument();

    // Wait for services to load
    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });
  });

  it('displays all services', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Hair Color')).toBeInTheDocument();
      expect(screen.getByText('Manicure')).toBeInTheDocument();
    });
  });

  it('shows service details correctly', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    // Check service details are displayed
    expect(screen.getByText('Professional haircut and styling')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('filters services by category', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    // Click on "Nail Services" category filter
    const nailCategory = screen.getByText('Nail Services');
    fireEvent.click(nailCategory);

    // Should show only nail services
    await waitFor(() => {
      expect(screen.queryByText('Haircut')).not.toBeInTheDocument();
      expect(screen.queryByText('Hair Color')).not.toBeInTheDocument();
      expect(screen.getByText('Manicure')).toBeInTheDocument();
    });
  });

  it('selects a service and calls onNext', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    // Click "Select" button for Haircut service
    const selectButtons = screen.getAllByText('Select');
    fireEvent.click(selectButtons[0]);

    // Should call onNext
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while fetching services', () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays "All Services" option to clear filter', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('All Services')).toBeInTheDocument();
    });

    // Should show service count
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('shows correct service count for each category', async () => {
    renderWithProviders(<ServiceSelectionStep onNext={mockOnNext} />);

    await waitFor(() => {
      expect(screen.getByText('Hair Services')).toBeInTheDocument();
    });

    // Should show correct counts
    expect(screen.getByText('(2)')).toBeInTheDocument(); // Hair Services has 2 services
  });
});
