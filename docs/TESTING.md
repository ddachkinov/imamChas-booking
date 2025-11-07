# Testing Guide

Comprehensive testing guide for the Booking Platform covering unit tests, integration tests, E2E tests, and manual testing scenarios.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Setup](#setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing](#manual-testing)
- [Test Data](#test-data)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Testing Strategy

### Testing Pyramid

```
       /\
      /E2E\
     /------\
    /  API  \
   /----------\
  /   Unit     \
 /--------------\
```

1. **Unit Tests** (70%) - Test individual components and functions
2. **Integration Tests** (20%) - Test API endpoints and database operations
3. **E2E Tests** (10%) - Test complete user workflows

### Coverage Goals

- **Overall**: 80% code coverage
- **Critical Paths**: 100% coverage (authentication, booking, payments)
- **UI Components**: 80% coverage
- **API Endpoints**: 90% coverage
- **Business Logic**: 95% coverage

## Setup

### Backend Testing

```bash
cd backend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Frontend Testing

```bash
cd frontend

# Install dependencies
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Unit Testing

### Backend Unit Tests

**Testing Framework**: Jest + TypeScript

**Example: Service Test**

```typescript
// backend/src/modules/appointments/appointments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: Repository<Appointment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
  });

  describe('checkAvailability', () => {
    it('should return available slots', async () => {
      // Arrange
      const date = '2025-11-15';
      const staffId = 'staff-123';
      const serviceId = 'service-456';

      // Act
      const slots = await service.checkAvailability(date, staffId, serviceId);

      // Assert
      expect(slots).toBeDefined();
      expect(slots.length).toBeGreaterThan(0);
    });

    it('should exclude blocked time', async () => {
      // Test implementation
    });

    it('should respect business hours', async () => {
      // Test implementation
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      // Test implementation
    });

    it('should prevent double booking', async () => {
      // Test implementation
    });

    it('should validate service duration', async () => {
      // Test implementation
    });
  });
});
```

**Example: Controller Test**

```typescript
// backend/src/modules/appointments/appointments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController';
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /appointments', () => {
    it('should create appointment', async () => {
      const dto = {
        client_id: 'client-123',
        service_id: 'service-456',
        staff_id: 'staff-789',
        date: '2025-11-15',
        start_time: '10:00',
      };

      const result = { id: 'apt-123', ...dto };
      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create(dto)).toEqual(result);
    });
  });
});
```

### Frontend Unit Tests

**Testing Framework**: Jest + React Testing Library

**Example: Component Test**

```typescript
// frontend/src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="primary">Button</Button>);
    expect(container.firstChild).toHaveClass('bg-primary-600');
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

**Example: Hook Test**

```typescript
// frontend/src/hooks/useToast.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  it('shows toast message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Success!', 'success');
    });

    // Assert toast is visible
  });

  it('auto-dismisses after delay', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Auto dismiss', 'info');
    });

    act(() => {
      jest.advanceTimersby(5000);
    });

    // Assert toast is removed
    jest.useRealTimers();
  });
});
```

## Integration Testing

### Backend Integration Tests

Test API endpoints with database operations.

```typescript
// backend/test/appointments.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/appointments (POST)', () => {
    it('should create appointment', () => {
      return request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client_id: 'client-123',
          service_id: 'service-456',
          staff_id: 'staff-789',
          date: '2025-11-15',
          start_time: '10:00',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('pending');
        });
    });

    it('should prevent double booking', () => {
      // Create first appointment
      // Attempt to create conflicting appointment
      // Expect 409 Conflict
    });
  });

  describe('/appointments/:id (GET)', () => {
    it('should get appointment by id', () => {
      // Test implementation
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer())
        .get('/appointments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### Frontend Integration Tests

Test components with API mocks.

```typescript
// frontend/src/pages/admin/appointments/AppointmentListPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentListPage } from './AppointmentListPage';
import { appointmentsApi } from '@/services/api';

jest.mock('@/services/api');

describe('AppointmentListPage', () => {
  const queryClient = new QueryClient();

  it('loads and displays appointments', async () => {
    const mockAppointments = [
      {
        id: '1',
        client_name: 'John Doe',
        service_name: 'Haircut',
        date: '2025-11-15',
        start_time: '10:00',
        status: 'confirmed',
      },
    ];

    (appointmentsApi.getAppointments as jest.Mock).mockResolvedValue({
      data: mockAppointments,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentListPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (appointmentsApi.getAppointments as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentListPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

Test complete user workflows.

```typescript
// frontend/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('complete booking as customer', async ({ page }) => {
    // Navigate to booking page
    await page.goto('http://localhost:3001/book/business-123');

    // Step 1: Select service
    await expect(page.locator('h1')).toContainText('Select a Service');
    await page.click('text=Haircut');
    await page.click('button:has-text("Next")');

    // Step 2: Select staff
    await expect(page.locator('h1')).toContainText('Choose Your Provider');
    await page.click('text=John Smith');
    await page.click('button:has-text("Next")');

    // Step 3: Select date and time
    await expect(page.locator('h1')).toContainText('Pick Date & Time');
    await page.click('[data-date="2025-11-15"]');
    await page.click('[data-time="10:00"]');
    await page.click('button:has-text("Next")');

    // Step 4: Enter client details
    await expect(page.locator('h1')).toContainText('Your Information');
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.fill('input[name="phone"]', '555-0123');
    await page.click('button:has-text("Book Appointment")');

    // Step 5: Confirmation
    await expect(page.locator('h1')).toContainText('Booking Confirmed');
    await expect(page.locator('text=Jane Doe')).toBeVisible();
    await expect(page.locator('text=Haircut')).toBeVisible();
  });

  test('handles validation errors', async ({ page }) => {
    await page.goto('http://localhost:3001/book/business-123');

    // Skip to client details without selections
    // Expect validation errors
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/admin/dashboard');
  });

  test('view and manage appointments', async ({ page }) => {
    // Navigate to appointments
    await page.click('text=Appointments');
    await expect(page).toHaveURL('**/admin/appointments');

    // Check appointments list is loaded
    await expect(page.locator('table')).toBeVisible();

    // Click on an appointment
    await page.click('tr:first-child');

    // View details in sidebar
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('create new service', async ({ page }) => {
    await page.click('text=Services');
    await page.click('button:has-text("Add Service")');

    await page.fill('input[name="name"]', 'New Service');
    await page.fill('input[name="price"]', '50');
    await page.fill('input[name="duration"]', '60');
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=Service created')).toBeVisible();
  });
});
```

## Manual Testing

### Critical User Flows

#### 1. Customer Booking Flow

**Pre-conditions:**
- At least one business with services and staff
- Business has availability

**Steps:**
1. Navigate to `/book/:businessId`
2. Select a service from the list
3. Select a staff member (or "First Available")
4. Choose a date with availability
5. Select an available time slot
6. Enter client information
7. Submit booking

**Expected Results:**
- Each step validates before proceeding
- Available slots are shown correctly
- Booking confirmation is displayed
- Email confirmation is sent (if configured)
- Appointment appears in admin calendar

#### 2. Admin Appointment Management

**Pre-conditions:**
- Logged in as admin user
- At least one appointment exists

**Steps:**
1. Navigate to `/admin/calendar`
2. View appointment in calendar
3. Click appointment to open details
4. Change status (e.g., Pending → Confirmed)
5. Add notes to appointment
6. Reschedule appointment
7. Cancel appointment

**Expected Results:**
- Appointment details load correctly
- Status updates are saved
- Notes are persisted
- Rescheduling checks for conflicts
- Cancellation shows confirmation dialog

#### 3. Business Setup

**Pre-conditions:**
- Logged in as business owner

**Steps:**
1. Complete business profile
2. Add location with business hours
3. Create services with pricing
4. Invite staff members
5. Configure notification settings
6. Connect integrations (optional)

**Expected Results:**
- All information is saved
- Staff receive invitation emails
- Services appear in booking flow
- Notifications are sent correctly

### Browser Testing

Test on multiple browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

### Device Testing

Test on multiple devices:
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (1024x768, 768x1024)
- ✅ Mobile (375x667, 414x896)

### Accessibility Testing

- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators
- ✅ ARIA labels

## Test Data

### Seed Data for Testing

```typescript
// backend/src/database/seeds/test-data.seed.ts
export const testData = {
  tenant: {
    name: 'Test Business',
    subdomain: 'test-business',
    tier: 'PROFESSIONAL',
  },
  users: [
    {
      email: 'admin@test.com',
      password: 'Test123!',
      role: 'ADMIN',
    },
    {
      email: 'staff@test.com',
      password: 'Test123!',
      role: 'STAFF',
    },
  ],
  services: [
    {
      name: 'Haircut',
      price: 30,
      duration: 30,
      category: 'Hair',
    },
    {
      name: 'Color',
      price: 80,
      duration: 120,
      category: 'Hair',
    },
  ],
  appointments: [
    {
      date: '2025-11-15',
      start_time: '10:00',
      status: 'confirmed',
    },
    {
      date: '2025-11-15',
      start_time: '14:00',
      status: 'pending',
    },
  ],
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run unit tests
        working-directory: ./backend
        run: npm test

      - name: Run E2E tests
        working-directory: ./backend
        run: npm run test:e2e

      - name: Generate coverage
        working-directory: ./backend
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage

  frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run tests
        working-directory: ./frontend
        run: npm test

      - name: Run E2E tests
        working-directory: ./frontend
        run: npm run test:e2e
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use clear test names** that describe the behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Keep tests isolated** - no dependencies between tests

### 2. Test Data

- **Use factories** for creating test data
- **Clean up after tests** to avoid side effects
- **Use realistic data** that matches production
- **Avoid hardcoding** - use variables and constants

### 3. Mocking

- **Mock external dependencies** (APIs, databases, time)
- **Don't mock what you own** - test real implementations
- **Use dependency injection** for testability
- **Clear mocks between tests**

### 4. Coverage

- **Aim for high coverage** but don't sacrifice quality
- **Focus on critical paths** first
- **Test edge cases** and error scenarios
- **Don't test implementation details** - test behavior

### 5. Performance

- **Keep tests fast** - unit tests should run in milliseconds
- **Run tests in parallel** when possible
- **Use test databases** that reset quickly
- **Cache dependencies** in CI

### 6. Maintenance

- **Update tests with code changes**
- **Refactor tests** when they become brittle
- **Remove obsolete tests**
- **Document complex test setups**

## Troubleshooting

### Common Issues

**Tests failing randomly**
- Check for race conditions
- Ensure tests are isolated
- Use proper async/await

**Slow test suite**
- Identify slow tests with `--verbose`
- Mock expensive operations
- Use test database fixtures

**Mocks not working**
- Clear mocks between tests
- Verify mock paths are correct
- Check mock is called before assertions

**E2E tests timing out**
- Increase timeout for slow operations
- Wait for specific elements
- Check network requests complete

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For testing questions or issues:
1. Check this documentation
2. Review test examples in codebase
3. Consult team testing guidelines
4. Ask in team chat or create issue

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
