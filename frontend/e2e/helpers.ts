import { Page } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@booking.local');
  await page.getByLabel(/password/i).fill('Admin123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}

/**
 * Login as staff member
 */
export async function loginAsStaff(page: Page, email = 'staff@booking.local', password = 'Staff123!') {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click user menu
  await page.getByTestId('user-menu-button').click();

  // Click logout
  await page.getByRole('menuitem', { name: /logout/i }).click();

  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Navigate to calendar page
 */
export async function navigateToCalendar(page: Page) {
  await page.goto('/admin/calendar');
  await page.waitForSelector('[data-testid="calendar-view"]', { timeout: 10000 });
}

/**
 * Select a specific date in the calendar
 */
export async function selectCalendarDate(page: Page, date: Date) {
  const dateString = date.toISOString().split('T')[0];

  // Click on the date picker if available
  const datePicker = page.getByTestId('date-picker');
  if (await datePicker.isVisible()) {
    await datePicker.click();
  }

  // Select the specific date
  await page.getByTestId(`calendar-date-${dateString}`).click();
}

/**
 * Create a new appointment via quick create modal
 */
export async function createAppointment(
  page: Page,
  data: {
    client: string;
    service: string;
    staff: string;
    date: string;
    time: string;
    notes?: string;
  }
) {
  // Open quick create modal
  await page.getByRole('button', { name: /new appointment/i }).click();

  // Wait for modal
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // Fill in details
  await page.getByLabel(/client/i).fill(data.client);

  await page.getByLabel(/service/i).click();
  await page.getByRole('option', { name: new RegExp(data.service, 'i') }).click();

  await page.getByLabel(/staff/i).click();
  await page.getByRole('option', { name: new RegExp(data.staff, 'i') }).click();

  await page.getByLabel(/date/i).fill(data.date);
  await page.getByLabel(/time/i).fill(data.time);

  if (data.notes) {
    await page.getByLabel(/notes/i).fill(data.notes);
  }

  // Submit
  await page.getByRole('button', { name: /create/i }).click();

  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
}

/**
 * Search for appointments
 */
export async function searchAppointments(page: Page, query: string) {
  await page.getByPlaceholder(/search/i).fill(query);

  // Wait for search to apply
  await page.waitForTimeout(500);
}

/**
 * Filter appointments by status
 */
export async function filterByStatus(page: Page, status: string) {
  // Open filters
  await page.getByRole('button', { name: /filters/i }).click();

  // Select status
  await page.getByRole('checkbox', { name: new RegExp(status, 'i') }).check();

  // Apply filter (if there's an apply button)
  const applyButton = page.getByRole('button', { name: /apply/i });
  if (await applyButton.isVisible()) {
    await applyButton.click();
  }

  // Wait for filter to apply
  await page.waitForTimeout(500);
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page) {
  const clearButton = page.getByRole('button', { name: /clear filters/i });
  if (await clearButton.isVisible()) {
    await clearButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Switch calendar view
 */
export async function switchCalendarView(page: Page, view: 'day' | 'week' | 'month') {
  await page.getByRole('button', { name: new RegExp(view, 'i') }).click();
  await page.waitForSelector(`[data-testid="${view}-view"]`, { timeout: 5000 });
}

/**
 * Navigate calendar dates
 */
export async function navigateCalendar(page: Page, direction: 'next' | 'previous' | 'today') {
  switch (direction) {
    case 'next':
      await page.getByRole('button', { name: /next/i }).click();
      break;
    case 'previous':
      await page.getByRole('button', { name: /previous/i }).click();
      break;
    case 'today':
      await page.getByRole('button', { name: /today/i }).click();
      break;
  }

  // Wait for calendar to update
  await page.waitForTimeout(300);
}

/**
 * Get appointment count
 */
export async function getAppointmentCount(page: Page): Promise<number> {
  const appointments = page.getByTestId('appointment-block');
  return await appointments.count();
}

/**
 * Click on an appointment by index
 */
export async function clickAppointment(page: Page, index = 0) {
  const appointments = page.getByTestId('appointment-block');
  await appointments.nth(index).click();

  // Wait for sidebar to open
  await page.waitForSelector('[data-testid="appointment-sidebar"]', { timeout: 5000 });
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(page: Page, status: string) {
  // Sidebar should be open
  await page.waitForSelector('[data-testid="appointment-sidebar"]', { timeout: 5000 });

  // Click status button
  await page.getByRole('button', { name: new RegExp(status, 'i') }).click();

  // Wait for status update
  await page.waitForTimeout(1000);
}

/**
 * Complete booking flow as customer
 */
export async function completeBookingFlow(
  page: Page,
  data: {
    businessId: string;
    service?: number; // Index of service to select
    staff?: number; // Index of staff to select, or null for "first available"
    dateIndex?: number; // Index of date to select
    timeIndex?: number; // Index of time slot to select
    client: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      notes?: string;
    };
  }
) {
  // Navigate to booking page
  await page.goto(`/book/${data.businessId}`);

  // Step 1: Select service
  await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
  await page.getByTestId('service-card').nth(data.service || 0).click();
  await page.getByRole('button', { name: 'Select' }).first().click();

  // Step 2: Select staff
  if (data.staff === null || data.staff === undefined) {
    // Select "First Available"
    await page.getByTestId('first-available-option').click();
  } else {
    await page.getByTestId('staff-card').nth(data.staff).click();
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 3: Select date and time
  await page.waitForSelector('[data-testid="calendar-day"]', { timeout: 10000 });
  await page.getByTestId('calendar-day').nth(data.dateIndex || 0).click();

  await page.waitForSelector('[data-testid="time-slot"]', { timeout: 10000 });
  await page.getByTestId('time-slot').nth(data.timeIndex || 0).click();

  await page.getByRole('button', { name: 'Next' }).click();

  // Step 4: Enter client details
  await page.getByLabel(/first name/i).fill(data.client.firstName);
  await page.getByLabel(/last name/i).fill(data.client.lastName);
  await page.getByLabel(/email/i).fill(data.client.email);
  await page.getByLabel(/phone/i).fill(data.client.phone);

  if (data.client.notes) {
    await page.getByLabel(/notes/i).fill(data.client.notes);
  }

  await page.getByRole('checkbox', { name: /accept.*terms/i }).check();

  // Submit booking
  await page.getByRole('button', { name: 'Confirm Booking' }).click();

  // Wait for confirmation
  await page.waitForSelector('[data-testid="booking-confirmation"]', { timeout: 10000 });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.getByRole('status').filter({ hasText: message || '' });
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  return toast;
}

/**
 * Export calendar data
 */
export async function exportCalendar(page: Page, format: 'ical' | 'csv' | 'print') {
  await page.getByRole('button', { name: /export/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: new RegExp(format, 'i') }).click();

  if (format !== 'print') {
    const download = await downloadPromise;
    return download;
  }
}

/**
 * Verify appointment details in sidebar
 */
export async function verifyAppointmentDetails(
  page: Page,
  expected: {
    client?: string;
    service?: string;
    staff?: string;
    status?: string;
  }
) {
  const sidebar = page.getByTestId('appointment-sidebar');
  await sidebar.waitFor({ state: 'visible' });

  if (expected.client) {
    await sidebar.getByText(new RegExp(expected.client, 'i')).waitFor();
  }

  if (expected.service) {
    await sidebar.getByText(new RegExp(expected.service, 'i')).waitFor();
  }

  if (expected.staff) {
    await sidebar.getByText(new RegExp(expected.staff, 'i')).waitFor();
  }

  if (expected.status) {
    await sidebar.getByText(new RegExp(expected.status, 'i')).waitFor();
  }
}
