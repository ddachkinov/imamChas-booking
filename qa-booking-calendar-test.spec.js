const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://demo.ic-booking.groundpoint.net';
const LOGIN_EMAIL = 'admin@example.com';
const LOGIN_PASSWORD = 'admin123';

// Store console logs and network errors
let consoleLogs = [];
let networkErrors = [];
let networkRequests = [];

test.describe('Booking Platform - Calendar and Booking QA Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Reset tracking arrays
    consoleLogs = [];
    networkErrors = [];
    networkRequests = [];

    // Listen for console messages
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // Listen for page errors
    page.on('pageerror', error => {
      consoleLogs.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    // Listen for failed network requests
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      });
    });

    // Track all network requests
    page.on('response', async response => {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        method: response.request().method(),
        headers: response.headers(),
        timing: response.request().timing()
      });
    });
  });

  test('1. Login with admin credentials', async ({ page }) => {
    await page.goto(BASE_URL);

    // Take screenshot of landing page
    await page.screenshot({ path: 'qa-screenshots/01-landing-page.png', fullPage: true });

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', { timeout: 10000 });

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();

    await emailInput.fill(LOGIN_EMAIL);
    await passwordInput.fill(LOGIN_PASSWORD);

    await page.screenshot({ path: 'qa-screenshots/02-login-filled.png', fullPage: true });

    // Submit login form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
    await submitButton.click();

    // Wait for navigation or dashboard to load
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'qa-screenshots/03-after-login.png', fullPage: true });

    // Check if we're logged in
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
  });

  test('2. Navigate to calendar/bookings page', async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    // Look for calendar/bookings link
    const calendarLinks = [
      'a:has-text("Calendar")',
      'a:has-text("Bookings")',
      'a[href*="calendar"]',
      'a[href*="booking"]',
      'nav a:has-text("Calendar")',
      '[role="navigation"] a:has-text("Calendar")'
    ];

    let calendarFound = false;
    for (const selector of calendarLinks) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log('Found calendar link with selector:', selector);
        await element.click();
        calendarFound = true;
        break;
      }
    }

    if (!calendarFound) {
      console.log('No calendar link found in navigation. Trying direct URL...');
      await page.goto(`${BASE_URL}/calendar`);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa-screenshots/04-calendar-page.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Calendar page URL:', currentUrl);
  });

  test('3. Test calendar date navigation', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    // Navigate to calendar
    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }

    await page.waitForTimeout(2000);

    // Test previous button
    const prevButton = page.locator('button:has-text("Previous"), button:has-text("Prev"), button[aria-label*="previous"]').first();
    if (await prevButton.count() > 0) {
      await prevButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'qa-screenshots/05-calendar-previous.png', fullPage: true });
    }

    // Test next button
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"]').first();
    if (await nextButton.count() > 0) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'qa-screenshots/06-calendar-next.png', fullPage: true });
    }

    // Test today button
    const todayButton = page.locator('button:has-text("Today")').first();
    if (await todayButton.count() > 0) {
      await todayButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'qa-screenshots/07-calendar-today.png', fullPage: true });
    }

    // Test view toggles (Day/Week/Month)
    const viewButtons = ['button:has-text("Day")', 'button:has-text("Week")', 'button:has-text("Month")'];
    for (const selector of viewButtons) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        await button.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `qa-screenshots/08-calendar-${selector.replace(/[^a-z]/gi, '')}.png`, fullPage: true });
      }
    }
  });

  test('4. Test creating new booking', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Look for "New Appointment" or "New Booking" button
    const newBookingSelectors = [
      'button:has-text("New Appointment")',
      'button:has-text("New Booking")',
      'button:has-text("Create")',
      'a:has-text("New Appointment")',
      '[data-testid="new-appointment"]'
    ];

    let newBookingFound = false;
    for (const selector of newBookingSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        console.log('Found new booking button:', selector);
        await page.screenshot({ path: 'qa-screenshots/09-before-new-booking.png', fullPage: true });
        await button.click();
        newBookingFound = true;
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (!newBookingFound) {
      console.log('No new booking button found');
    }

    await page.screenshot({ path: 'qa-screenshots/10-new-booking-modal.png', fullPage: true });

    // Try to find and fill the booking form
    const formSelectors = {
      clientName: ['input[name="client_name"]', 'input[name="clientName"]', 'input[placeholder*="name" i]'],
      service: ['select[name="service"]', 'select[name="service_id"]', '[role="combobox"]'],
      date: ['input[type="date"]', 'input[name="date"]'],
      time: ['input[type="time"]', 'select[name="time"]']
    };

    // Try to interact with form fields if they exist
    for (const [field, selectors] of Object.entries(formSelectors)) {
      for (const selector of selectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`Found ${field} field:`, selector);
          break;
        }
      }
    }
  });

  test('5. Test booking form validation', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Try to click new booking button
    const newBookingButton = page.locator('button:has-text("New Appointment"), button:has-text("New Booking")').first();
    if (await newBookingButton.count() > 0) {
      await newBookingButton.click();
      await page.waitForTimeout(1000);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'qa-screenshots/11-validation-errors.png', fullPage: true });

        // Look for error messages
        const errorMessages = await page.locator('.error, .error-message, [role="alert"], .text-red-500, .text-danger').allTextContents();
        console.log('Validation errors:', errorMessages);
      }
    }
  });

  test('6. Test time slot selection', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Look for time slots on the calendar
    const timeSlotSelectors = [
      '[data-time]',
      '.time-slot',
      '[class*="time-slot"]',
      '[class*="calendar-slot"]'
    ];

    for (const selector of timeSlotSelectors) {
      const slots = page.locator(selector);
      const count = await slots.count();
      if (count > 0) {
        console.log(`Found ${count} time slots with selector:`, selector);
        // Try clicking the first available slot
        await slots.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'qa-screenshots/12-time-slot-selected.png', fullPage: true });
        break;
      }
    }
  });

  test('7. Test viewing existing bookings', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Look for existing appointments/bookings
    const appointmentSelectors = [
      '.appointment',
      '[data-appointment]',
      '[class*="appointment"]',
      '[class*="booking"]',
      '.event'
    ];

    for (const selector of appointmentSelectors) {
      const appointments = page.locator(selector);
      const count = await appointments.count();
      if (count > 0) {
        console.log(`Found ${count} appointments with selector:`, selector);
        // Click on the first appointment to view details
        await appointments.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'qa-screenshots/13-appointment-details.png', fullPage: true });
        break;
      }
    }
  });

  test('8. Test editing bookings', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Find and click on an appointment
    const appointment = page.locator('.appointment, [data-appointment], [class*="appointment"]').first();
    if (await appointment.count() > 0) {
      await appointment.click();
      await page.waitForTimeout(1000);

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'qa-screenshots/14-edit-booking.png', fullPage: true });
      }
    }
  });

  test('9. Test deleting bookings', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Find and click on an appointment
    const appointment = page.locator('.appointment, [data-appointment], [class*="appointment"]').first();
    if (await appointment.count() > 0) {
      await appointment.click();
      await page.waitForTimeout(1000);

      // Look for delete button
      const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Remove"), [aria-label*="delete" i]').first();
      if (await deleteButton.count() > 0) {
        await page.screenshot({ path: 'qa-screenshots/15-before-delete.png', fullPage: true });
        // Note: Not actually deleting to preserve data, just testing if the button exists
        console.log('Delete button found');
      }
    }
  });

  test('10. Test filtering/search functionality', async ({ page }) => {
    // Login and navigate to calendar
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(2000);

    // Look for search/filter controls
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    if (await searchInput.count() > 0) {
      console.log('Search input found');
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'qa-screenshots/16-search-filter.png', fullPage: true });
    }

    // Look for filter dropdowns
    const filterSelects = page.locator('select, [role="combobox"]');
    const count = await filterSelects.count();
    console.log(`Found ${count} filter/select controls`);
  });

  test('11. Check for console errors and network failures', async ({ page }) => {
    // Login and navigate through the app
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const calendarLink = page.locator('a:has-text("Calendar"), a[href*="calendar"]').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
    } else {
      await page.goto(`${BASE_URL}/calendar`);
    }
    await page.waitForTimeout(3000);

    // Report console errors
    const errors = consoleLogs.filter(log => log.type === 'error' || log.type === 'pageerror');
    console.log('\n=== CONSOLE ERRORS ===');
    console.log(JSON.stringify(errors, null, 2));

    // Report network failures
    console.log('\n=== NETWORK FAILURES ===');
    console.log(JSON.stringify(networkErrors, null, 2));

    // Report failed HTTP requests
    const failedRequests = networkRequests.filter(req => req.status >= 400);
    console.log('\n=== FAILED HTTP REQUESTS ===');
    console.log(JSON.stringify(failedRequests, null, 2));
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Generate report for this test
    const report = {
      testName: testInfo.title,
      status: testInfo.status,
      duration: testInfo.duration,
      consoleLogs: consoleLogs,
      networkErrors: networkErrors,
      failedRequests: networkRequests.filter(req => req.status >= 400),
      screenshots: testInfo.attachments
    };

    console.log('\n=== TEST REPORT ===');
    console.log(JSON.stringify(report, null, 2));
  });
});
