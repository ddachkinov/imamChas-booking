import { test, expect } from '@playwright/test';

test.describe('Admin Appointment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (this would need proper authentication)
    await page.goto('/login');

    // Fill in login credentials
    await page.getByLabel(/email/i).fill('admin@booking.local');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });

    // Navigate to calendar
    await page.goto('/admin/calendar');
  });

  test('should display calendar with appointments', async ({ page }) => {
    await test.step('Verify calendar loads', async () => {
      // Calendar should be visible
      await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();

      // View switcher should be visible
      await expect(page.getByRole('button', { name: /day/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /week/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /month/i })).toBeVisible();

      // Navigation buttons should be visible
      await expect(page.getByRole('button', { name: /today/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    });
  });

  test('should switch between calendar views', async ({ page }) => {
    await test.step('Switch to day view', async () => {
      await page.getByRole('button', { name: /day/i }).click();

      // Day view should show time grid
      await expect(page.getByTestId('day-view')).toBeVisible();
      await expect(page.getByText(/8:00 AM/i)).toBeVisible();
      await expect(page.getByText(/8:00 PM/i)).toBeVisible();
    });

    await test.step('Switch to week view', async () => {
      await page.getByRole('button', { name: /week/i }).click();

      // Week view should show 7 days
      await expect(page.getByTestId('week-view')).toBeVisible();
      const days = page.getByTestId('week-day');
      await expect(days).toHaveCount(7);
    });

    await test.step('Switch to month view', async () => {
      await page.getByRole('button', { name: /month/i }).click();

      // Month view should show calendar grid
      await expect(page.getByTestId('month-view')).toBeVisible();
      await expect(page.getByTestId('calendar-day')).toHaveCount(28, { timeout: 5000 }); // At least 28 days
    });
  });

  test('should navigate dates', async ({ page }) => {
    await test.step('Navigate to next day', async () => {
      // Get current date text
      const currentDate = await page.getByTestId('current-date').textContent();

      // Click next
      await page.getByRole('button', { name: /next/i }).click();

      // Date should change
      const newDate = await page.getByTestId('current-date').textContent();
      expect(newDate).not.toBe(currentDate);
    });

    await test.step('Navigate to previous day', async () => {
      const currentDate = await page.getByTestId('current-date').textContent();

      await page.getByRole('button', { name: /previous/i }).click();

      const newDate = await page.getByTestId('current-date').textContent();
      expect(newDate).not.toBe(currentDate);
    });

    await test.step('Jump to today', async () => {
      // Navigate away from today
      await page.getByRole('button', { name: /next/i }).click();
      await page.getByRole('button', { name: /next/i }).click();

      // Jump back to today
      await page.getByRole('button', { name: /today/i }).click();

      // Should show today's date
      const dateText = await page.getByTestId('current-date').textContent();
      const today = new Date();
      const todayFormatted = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(dateText).toContain(today.getDate().toString());
    });
  });

  test('should view appointment details', async ({ page }) => {
    // Ensure we're in day view
    await page.getByRole('button', { name: /day/i }).click();

    // Wait for appointments to load
    await page.waitForSelector('[data-testid="appointment-block"]', { timeout: 10000 });

    // Click on an appointment
    await page.getByTestId('appointment-block').first().click();

    // Sidebar should open with details
    await expect(page.getByTestId('appointment-sidebar')).toBeVisible();

    // Should show appointment details
    await expect(page.getByText(/client/i)).toBeVisible();
    await expect(page.getByText(/service/i)).toBeVisible();
    await expect(page.getByText(/staff/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
  });

  test('should update appointment status', async ({ page }) => {
    // Click on appointment
    await page.waitForSelector('[data-testid="appointment-block"]', { timeout: 10000 });
    await page.getByTestId('appointment-block').first().click();

    // Wait for sidebar
    await expect(page.getByTestId('appointment-sidebar')).toBeVisible();

    // Check current status
    const currentStatus = await page.getByTestId('status-badge').textContent();

    // Click status update button (e.g., "Check In")
    const checkInButton = page.getByRole('button', { name: /check in/i });
    if (await checkInButton.isVisible()) {
      await checkInButton.click();

      // Status should update
      await page.waitForTimeout(1000); // Wait for status update
      const newStatus = await page.getByTestId('status-badge').textContent();
      expect(newStatus).not.toBe(currentStatus);
    }
  });

  test('should filter appointments by status', async ({ page }) => {
    await test.step('Open filters', async () => {
      await page.getByRole('button', { name: /filters/i }).click();

      // Filter menu should be visible
      await expect(page.getByTestId('filter-menu')).toBeVisible();
    });

    await test.step('Filter by confirmed status', async () => {
      // Select "Confirmed" status
      await page.getByRole('checkbox', { name: /confirmed/i }).check();

      // Apply filter (if there's an apply button)
      const applyButton = page.getByRole('button', { name: /apply/i });
      if (await applyButton.isVisible()) {
        await applyButton.click();
      }

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // All visible appointments should be confirmed
      const appointments = page.getByTestId('appointment-block');
      const count = await appointments.count();

      if (count > 0) {
        // Check first appointment has confirmed status
        await appointments.first().click();
        await expect(page.getByText(/confirmed/i)).toBeVisible();
      }
    });
  });

  test('should search appointments', async ({ page }) => {
    // Enter search query
    await page.getByPlaceholder(/search/i).fill('John');

    // Wait for search results
    await page.waitForTimeout(500);

    // Results should be filtered
    // If there are results, they should contain "John"
    const appointments = page.getByTestId('appointment-block');
    const count = await appointments.count();

    if (count > 0) {
      await appointments.first().click();
      await expect(page.getByTestId('appointment-sidebar')).toContainText(/john/i);
    }
  });

  test('should create new appointment via quick create', async ({ page }) => {
    // Click "New Appointment" button
    await page.getByRole('button', { name: /new appointment/i }).click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /new appointment/i })).toBeVisible();

    // Fill in appointment details
    await page.getByLabel(/client/i).fill('Jane Doe');
    await page.getByLabel(/service/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/staff/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/date/i).fill('2025-11-15');
    await page.getByLabel(/time/i).fill('10:00');

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Success message should appear
    await expect(page.getByText(/created successfully/i)).toBeVisible();
  });

  test('should export appointments', async ({ page }) => {
    // Click export button
    await page.getByRole('button', { name: /export/i }).click();

    // Export menu should appear
    await expect(page.getByRole('menu')).toBeVisible();

    // Should have export options
    await expect(page.getByRole('menuitem', { name: /ical/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /csv/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /print/i })).toBeVisible();

    // Click iCal export (download will happen)
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /ical/i }).click();
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toContain('.ics');
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    await test.step('Press T to jump to today', async () => {
      // Navigate away from today
      await page.getByRole('button', { name: /next/i }).click();

      // Press T key
      await page.keyboard.press('t');

      // Should jump to today
      const dateText = await page.getByTestId('current-date').textContent();
      const today = new Date();
      expect(dateText).toContain(today.getDate().toString());
    });

    await test.step('Press D for day view', async () => {
      // Ensure not in day view
      await page.getByRole('button', { name: /week/i }).click();

      // Press D key
      await page.keyboard.press('d');

      // Should switch to day view
      await expect(page.getByTestId('day-view')).toBeVisible();
    });

    await test.step('Press W for week view', async () => {
      await page.keyboard.press('w');
      await expect(page.getByTestId('week-view')).toBeVisible();
    });

    await test.step('Press M for month view', async () => {
      await page.keyboard.press('m');
      await expect(page.getByTestId('month-view')).toBeVisible();
    });

    await test.step('Press Arrow keys to navigate', async () => {
      // Switch to day view
      await page.keyboard.press('d');

      const currentDate = await page.getByTestId('current-date').textContent();

      // Press right arrow
      await page.keyboard.press('ArrowRight');

      const newDate = await page.getByTestId('current-date').textContent();
      expect(newDate).not.toBe(currentDate);

      // Press left arrow to go back
      await page.keyboard.press('ArrowLeft');

      const backDate = await page.getByTestId('current-date').textContent();
      expect(backDate).toBe(currentDate);
    });

    await test.step('Press ? to show keyboard shortcuts help', async () => {
      await page.keyboard.press('?');

      // Help modal should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test('should show metrics in day view', async ({ page }) => {
    // Switch to day view
    await page.getByRole('button', { name: /day/i }).click();

    // Metrics widget should be visible
    await expect(page.getByTestId('calendar-metrics')).toBeVisible();

    // Should show key metrics
    await expect(page.getByText(/total appointments/i)).toBeVisible();
    await expect(page.getByText(/confirmed/i)).toBeVisible();
    await expect(page.getByText(/revenue/i)).toBeVisible();
  });

  test('should close sidebar with Escape key', async ({ page }) => {
    // Open appointment details
    await page.waitForSelector('[data-testid="appointment-block"]', { timeout: 10000 });
    await page.getByTestId('appointment-block').first().click();

    // Sidebar should be visible
    await expect(page.getByTestId('appointment-sidebar')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Sidebar should close
    await expect(page.getByTestId('appointment-sidebar')).not.toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/admin/calendar');

    // Calendar should be responsive
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();

    // View switcher should be accessible
    await page.getByRole('button', { name: /day/i }).click();
    await expect(page.getByTestId('day-view')).toBeVisible();
  });
});
