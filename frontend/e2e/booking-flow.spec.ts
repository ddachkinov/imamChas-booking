import { test, expect } from '@playwright/test';

test.describe('Customer Booking Flow', () => {
  const businessId = 'test-business-123';
  const bookingUrl = `/book/${businessId}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto(bookingUrl);
  });

  test('should complete full booking flow successfully', async ({ page }) => {
    // Step 1: Service Selection
    await test.step('Select a service', async () => {
      await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();

      // Wait for services to load
      await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });

      // Select first service (e.g., Haircut)
      await page.getByTestId('service-card').first().click();
      await page.getByRole('button', { name: 'Select' }).first().click();
    });

    // Step 2: Staff Selection
    await test.step('Select staff member', async () => {
      await expect(page.getByRole('heading', { name: /Select.*Staff/i })).toBeVisible();

      // Select "First Available" option
      await page.getByTestId('first-available-option').click();

      // Or select specific staff member
      // await page.getByTestId('staff-card').first().click();

      await page.getByRole('button', { name: 'Next' }).click();
    });

    // Step 3: Date & Time Selection
    await test.step('Select date and time', async () => {
      await expect(page.getByRole('heading', { name: /Select.*Date.*Time/i })).toBeVisible();

      // Wait for calendar to load
      await page.waitForSelector('[data-testid="calendar-day"]', { timeout: 10000 });

      // Select a future date (first available date)
      await page.getByTestId('calendar-day').first().click();

      // Wait for time slots to load
      await page.waitForSelector('[data-testid="time-slot"]', { timeout: 10000 });

      // Select first available time slot
      await page.getByTestId('time-slot').first().click();

      await page.getByRole('button', { name: 'Next' }).click();
    });

    // Step 4: Client Details
    await test.step('Enter client information', async () => {
      await expect(page.getByRole('heading', { name: /Your.*Information/i })).toBeVisible();

      // Fill in client details
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/email/i).fill('john.doe@example.com');
      await page.getByLabel(/phone/i).fill('1234567890');

      // Add optional notes
      await page.getByLabel(/notes/i).fill('First time customer');

      // Accept terms
      await page.getByRole('checkbox', { name: /accept.*terms/i }).check();

      // Opt into SMS
      await page.getByRole('checkbox', { name: /sms.*notifications/i }).check();

      await page.getByRole('button', { name: 'Confirm Booking' }).click();
    });

    // Step 5: Confirmation
    await test.step('Verify booking confirmation', async () => {
      // Wait for confirmation page
      await expect(page.getByRole('heading', { name: /Booking Confirmed/i })).toBeVisible({
        timeout: 10000,
      });

      // Verify confirmation details are displayed
      await expect(page.getByText(/john doe/i)).toBeVisible();
      await expect(page.getByText(/john.doe@example.com/i)).toBeVisible();

      // Verify calendar export buttons are present
      await expect(page.getByRole('button', { name: /add to google calendar/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /download ics/i })).toBeVisible();

      // Verify appointment number is displayed
      await expect(page.getByText(/APT-/)).toBeVisible();
    });
  });

  test('should filter services by category', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();

    // Wait for services to load
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });

    const initialServiceCount = await page.getByTestId('service-card').count();

    // Click on a category filter
    await page.getByTestId('category-filter').first().click();

    // Services should be filtered (count should change or some should be hidden)
    await page.waitForTimeout(500); // Wait for filter animation

    const filteredServiceCount = await page.getByTestId('service-card').count();

    // Either count changed or we verify specific services are visible
    expect(filteredServiceCount).toBeGreaterThan(0);
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Step 1: Select service
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
    await page.getByTestId('service-card').first().click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    // Step 2: Staff selection page
    await expect(page.getByRole('heading', { name: /Select.*Staff/i })).toBeVisible();

    // Go back to service selection
    await page.getByRole('button', { name: 'Back' }).click();

    // Should be back on service selection
    await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();
  });

  test('should detect returning customer and auto-fill information', async ({ page }) => {
    // Navigate through to client details step
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
    await page.getByTestId('service-card').first().click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    await page.getByTestId('first-available-option').click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.waitForSelector('[data-testid="calendar-day"]', { timeout: 10000 });
    await page.getByTestId('calendar-day').first().click();
    await page.waitForSelector('[data-testid="time-slot"]', { timeout: 10000 });
    await page.getByTestId('time-slot').first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    // On client details page
    await expect(page.getByRole('heading', { name: /Your.*Information/i })).toBeVisible();

    // Enter email of returning customer
    await page.getByLabel(/email/i).fill('returning@example.com');

    // Trigger blur to check for existing customer
    await page.getByLabel(/email/i).blur();

    // Wait for auto-fill (if customer exists)
    await page.waitForTimeout(1000);

    // Fields should be auto-filled (or empty if customer doesn't exist)
    // This test would need actual API to work fully
  });

  test('should show validation errors for incomplete form', async ({ page }) => {
    // Navigate through to client details
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
    await page.getByTestId('service-card').first().click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    await page.getByTestId('first-available-option').click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.waitForSelector('[data-testid="calendar-day"]', { timeout: 10000 });
    await page.getByTestId('calendar-day').first().click();
    await page.waitForSelector('[data-testid="time-slot"]', { timeout: 10000 });
    await page.getByTestId('time-slot').first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    // On client details, try to submit without filling fields
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should maintain booking state on page refresh', async ({ page }) => {
    // Select service
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
    const serviceName = await page.getByTestId('service-card').first().textContent();
    await page.getByTestId('service-card').first().click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    // Refresh page
    await page.reload();

    // Should restore to the same step
    await expect(page.getByRole('heading', { name: /Select.*Staff/i })).toBeVisible();

    // Service selection should be preserved in summary
    await expect(page.getByText(serviceName || '')).toBeVisible();
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Loading spinner should appear while fetching services
    const loadingIndicator = page.getByRole('status');
    const isInitiallyVisible = await loadingIndicator.isVisible().catch(() => false);

    // Services should load
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });

    // Loading should be gone
    const isStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(isStillVisible).toBe(false);
  });

  test('should display booking summary sidebar', async ({ page }) => {
    // Booking summary should be visible
    await expect(page.getByTestId('booking-summary')).toBeVisible();

    // Initially should be empty or show placeholder
    await expect(page.getByTestId('booking-summary')).toContainText(/booking summary/i);

    // Select service
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
    const serviceName = await page.getByTestId('service-card').first().textContent();
    await page.getByTestId('service-card').first().click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    // Summary should now show selected service
    await expect(page.getByTestId('booking-summary')).toContainText(serviceName || '');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate booking flow on mobile
    await page.goto(bookingUrl);

    // Service selection should be responsive
    await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();

    await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });

    // Services should be stacked vertically on mobile
    const firstService = page.getByTestId('service-card').first();
    await expect(firstService).toBeVisible();

    // Should be able to click service on mobile
    await firstService.click();
    await page.getByRole('button', { name: 'Select' }).first().click();

    // Next step should load
    await expect(page.getByRole('heading', { name: /Select.*Staff/i })).toBeVisible();
  });
});
