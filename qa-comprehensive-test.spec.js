const { test, expect } = require('@playwright/test');
const fs = require('fs');

const BASE_URL = 'https://demo.ic-booking.groundpoint.net';
const LOGIN_EMAIL = 'admin@example.com';
const LOGIN_PASSWORD = 'admin123';

// Store all diagnostic data
let bugReport = {
  testDate: new Date().toISOString(),
  bugs: [],
  consoleErrors: [],
  networkErrors: [],
  screenshots: []
};

test.describe('Booking Platform - Comprehensive QA Testing', () => {

  test('Complete Calendar and Booking Functionality Test', async ({ page }) => {
    const testLog = [];
    const consoleMessages = [];
    const networkRequests = [];
    const failedRequests = [];

    // Listen for console messages
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleMessages.push(logEntry);
      if (msg.type() === 'error') {
        bugReport.consoleErrors.push(logEntry);
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      const errorEntry = {
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      };
      consoleMessages.push(errorEntry);
      bugReport.consoleErrors.push(errorEntry);
    });

    // Listen for request failures
    page.on('requestfailed', request => {
      const failure = {
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      };
      failedRequests.push(failure);
      bugReport.networkErrors.push(failure);
    });

    // Track all network requests
    page.on('response', async response => {
      const req = {
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        contentType: response.headers()['content-type']
      };
      networkRequests.push(req);

      if (response.status() >= 400) {
        failedRequests.push(req);
        bugReport.bugs.push({
          severity: response.status() >= 500 ? 'critical' : 'high',
          type: 'network',
          description: `HTTP ${response.status()} error on ${response.request().method()} ${response.url()}`,
          endpoint: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    // TEST 1: Navigate to landing page
    testLog.push('TEST 1: Navigate to landing page');
    console.log('\\n=== TEST 1: Navigate to landing page ===');

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000); // Wait for any dynamic content
      await page.screenshot({ path: 'qa-screenshots/01-landing-page.png', fullPage: true });

      const pageContent = await page.content();
      testLog.push(`✓ Landing page loaded. URL: ${page.url()}`);
      console.log(`✓ Landing page loaded. URL: ${page.url()}`);

      // Check if we got redirected
      if (page.url() !== BASE_URL && page.url() !== BASE_URL + '/') {
        testLog.push(`⚠ Redirected to: ${page.url()}`);
        console.log(`⚠ Redirected to: ${page.url()}`);
      }

      // Check for loading states
      const loadingText = await page.locator('text=Loading').count();
      if (loadingText > 0) {
        testLog.push('⚠ Page shows "Loading..." - may indicate stuck state');
        console.log('⚠ Page shows "Loading..." - may indicate stuck state');
        bugReport.bugs.push({
          severity: 'high',
          type: 'frontend',
          description: 'Landing page stuck on "Loading..." state',
          stepsToReproduce: ['Navigate to ' + BASE_URL],
          expectedBehavior: 'Page should load completely and show login form or dashboard',
          actualBehavior: 'Page remains in loading state indefinitely'
        });
      }

    } catch (error) {
      testLog.push(`✗ Failed to load landing page: ${error.message}`);
      console.log(`✗ Failed to load landing page: ${error.message}`);
      bugReport.bugs.push({
        severity: 'critical',
        type: 'infrastructure',
        description: 'Landing page failed to load',
        error: error.message
      });
    }

    // TEST 2: Check for login form
    testLog.push('\\nTEST 2: Check for login form');
    console.log('\\n=== TEST 2: Check for login form ===');

    const loginSelectors = [
      { selector: 'input[type="email"]', name: 'Email input' },
      { selector: 'input[type="password"]', name: 'Password input' },
      { selector: 'button[type="submit"]', name: 'Submit button' },
      { selector: 'form', name: 'Login form' }
    ];

    for (const { selector, name } of loginSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        testLog.push(`✓ Found ${name}`);
        console.log(`✓ Found ${name}`);
      } else {
        testLog.push(`✗ ${name} not found`);
        console.log(`✗ ${name} not found`);
        bugReport.bugs.push({
          severity: 'critical',
          type: 'frontend',
          description: `Login form missing: ${name}`,
          stepsToReproduce: ['Navigate to ' + BASE_URL],
          expectedBehavior: `${name} should be visible on login page`,
          actualBehavior: `${name} not found in DOM`
        });
      }
    }

    // TEST 3: Attempt login (if form exists)
    testLog.push('\\nTEST 3: Attempt login');
    console.log('\\n=== TEST 3: Attempt login ===');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      try {
        await emailInput.fill(LOGIN_EMAIL);
        await passwordInput.fill(LOGIN_PASSWORD);
        await page.screenshot({ path: 'qa-screenshots/02-login-filled.png', fullPage: true });

        await submitButton.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'qa-screenshots/03-after-login.png', fullPage: true });

        const currentUrl = page.url();
        testLog.push(`✓ Login attempted. Current URL: ${currentUrl}`);
        console.log(`✓ Login attempted. Current URL: ${currentUrl}`);

        // Check if we're still on login page
        if (currentUrl.includes('login')) {
          testLog.push('⚠ Still on login page after submission');
          console.log('⚠ Still on login page after submission');

          // Look for error messages
          const errorSelectors = ['.error', '[role="alert"]', '.text-red-500', '.alert-danger'];
          for (const selector of errorSelectors) {
            const errors = await page.locator(selector).allTextContents();
            if (errors.length > 0) {
              testLog.push(`  Error messages: ${errors.join(', ')}`);
              console.log(`  Error messages: ${errors.join(', ')}`);
            }
          }

          bugReport.bugs.push({
            severity: 'critical',
            type: 'authentication',
            description: 'Login does not redirect after submission',
            stepsToReproduce: [
              'Navigate to ' + BASE_URL,
              'Enter email: ' + LOGIN_EMAIL,
              'Enter password: (hidden)',
              'Click submit button'
            ],
            expectedBehavior: 'Should redirect to dashboard after successful login',
            actualBehavior: 'Remains on login page'
          });
        }

      } catch (error) {
        testLog.push(`✗ Login failed: ${error.message}`);
        console.log(`✗ Login failed: ${error.message}`);
        bugReport.bugs.push({
          severity: 'critical',
          type: 'authentication',
          description: 'Login process threw error',
          error: error.message
        });
      }
    } else {
      testLog.push('✗ Skipping login test - form not found');
      console.log('✗ Skipping login test - form not found');
    }

    // TEST 4: Navigate to calendar (try multiple approaches)
    testLog.push('\\nTEST 4: Navigate to calendar');
    console.log('\\n=== TEST 4: Navigate to calendar ===');

    // Try finding calendar link in navigation
    const calendarLinkSelectors = [
      'a:has-text("Calendar")',
      'a[href*="calendar"]',
      'nav a:has-text("Calendar")',
      '[href="/calendar"]',
      '[href="/admin/calendar"]'
    ];

    let calendarAccessible = false;
    for (const selector of calendarLinkSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        try {
          await page.locator(selector).first().click();
          await page.waitForTimeout(3000);
          calendarAccessible = true;
          testLog.push(`✓ Navigated to calendar via ${selector}`);
          console.log(`✓ Navigated to calendar via ${selector}`);
          break;
        } catch (error) {
          testLog.push(`✗ Failed to click calendar link: ${error.message}`);
          console.log(`✗ Failed to click calendar link: ${error.message}`);
        }
      }
    }

    // Try direct URL navigation
    if (!calendarAccessible) {
      testLog.push('⚠ No calendar link found, trying direct URL...');
      console.log('⚠ No calendar link found, trying direct URL...');

      const calendarUrls = [
        `${BASE_URL}/calendar`,
        `${BASE_URL}/admin/calendar`,
        `${BASE_URL}/bookings`
      ];

      for (const url of calendarUrls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(3000);
          testLog.push(`✓ Accessed calendar at ${url}`);
          console.log(`✓ Accessed calendar at ${url}`);
          calendarAccessible = true;
          break;
        } catch (error) {
          testLog.push(`✗ Failed to access ${url}: ${error.message}`);
          console.log(`✗ Failed to access ${url}: ${error.message}`);
        }
      }
    }

    if (calendarAccessible) {
      await page.screenshot({ path: 'qa-screenshots/04-calendar-page.png', fullPage: true });

      // TEST 5: Check calendar components
      testLog.push('\\nTEST 5: Check calendar components');
      console.log('\\n=== TEST 5: Check calendar components ===');

      const calendarComponents = [
        { selector: 'button:has-text("New Appointment"), button:has-text("New Booking")', name: 'New Appointment button' },
        { selector: 'button:has-text("Previous"), button:has-text("Prev")', name: 'Previous button' },
        { selector: 'button:has-text("Next")', name: 'Next button' },
        { selector: 'button:has-text("Today")', name: 'Today button' },
        { selector: 'button:has-text("Day")', name: 'Day view button' },
        { selector: 'button:has-text("Week")', name: 'Week view button' },
        { selector: 'button:has-text("Month")', name: 'Month view button' }
      ];

      for (const { selector, name } of calendarComponents) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          testLog.push(`✓ Found ${name}`);
          console.log(`✓ Found ${name}`);
        } else {
          testLog.push(`✗ ${name} not found`);
          console.log(`✗ ${name} not found`);
          bugReport.bugs.push({
            severity: 'medium',
            type: 'ui',
            description: `Calendar component missing: ${name}`,
            stepsToReproduce: ['Navigate to calendar page'],
            expectedBehavior: `${name} should be visible on calendar`,
            actualBehavior: `${name} not found in DOM`
          });
        }
      }

      // TEST 6: Test calendar navigation
      testLog.push('\\nTEST 6: Test calendar navigation');
      console.log('\\n=== TEST 6: Test calendar navigation ===');

      const navTests = [
        { selector: 'button:has-text("Week")', name: 'Week view', screenshot: '05-week-view.png' },
        { selector: 'button:has-text("Day")', name: 'Day view', screenshot: '06-day-view.png' },
        { selector: 'button:has-text("Previous")', name: 'Previous', screenshot: '07-previous.png' },
        { selector: 'button:has-text("Next")', name: 'Next', screenshot: '08-next.png' },
        { selector: 'button:has-text("Today")', name: 'Today', screenshot: '09-today.png' }
      ];

      for (const { selector, name, screenshot } of navTests) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          try {
            await button.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `qa-screenshots/${screenshot}`, fullPage: true });
            testLog.push(`✓ ${name} navigation works`);
            console.log(`✓ ${name} navigation works`);
          } catch (error) {
            testLog.push(`✗ ${name} navigation failed: ${error.message}`);
            console.log(`✗ ${name} navigation failed: ${error.message}`);
            bugReport.bugs.push({
              severity: 'medium',
              type: 'functionality',
              description: `Calendar navigation failed: ${name}`,
              stepsToReproduce: ['Navigate to calendar', `Click ${name} button`],
              expectedBehavior: `Calendar should change view to ${name}`,
              actualBehavior: `Error: ${error.message}`
            });
          }
        }
      }

      // TEST 7: Test New Appointment button
      testLog.push('\\nTEST 7: Test New Appointment button');
      console.log('\\n=== TEST 7: Test New Appointment button ===');

      const newApptButton = page.locator('button:has-text("New Appointment"), button:has-text("New Booking")').first();
      if (await newApptButton.count() > 0) {
        try {
          await page.screenshot({ path: 'qa-screenshots/10-before-new-appointment.png', fullPage: true });
          await newApptButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'qa-screenshots/11-after-new-appointment-click.png', fullPage: true });

          // Check if modal/form appeared
          const modalSelectors = ['[role="dialog"]', '.modal', '[class*="modal"]', 'form'];
          let modalFound = false;
          for (const selector of modalSelectors) {
            if (await page.locator(selector).count() > 0) {
              testLog.push(`✓ New appointment form/modal appeared`);
              console.log(`✓ New appointment form/modal appeared`);
              modalFound = true;
              break;
            }
          }

          if (!modalFound) {
            testLog.push('⚠ New appointment button clicked but no form appeared');
            console.log('⚠ New appointment button clicked but no form appeared');
            bugReport.bugs.push({
              severity: 'high',
              type: 'functionality',
              description: 'New Appointment button does not show booking form',
              stepsToReproduce: ['Navigate to calendar', 'Click "New Appointment" button'],
              expectedBehavior: 'Booking form modal should appear',
              actualBehavior: 'No modal or form appears after clicking button'
            });
          }

        } catch (error) {
          testLog.push(`✗ New Appointment button failed: ${error.message}`);
          console.log(`✗ New Appointment button failed: ${error.message}`);
          bugReport.bugs.push({
            severity: 'critical',
            type: 'functionality',
            description: 'New Appointment button causes error',
            stepsToReproduce: ['Navigate to calendar', 'Click "New Appointment" button'],
            expectedBehavior: 'Booking form should open',
            actualBehavior: `Error: ${error.message}`,
            consoleErrors: consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror')
          });
        }
      }

      // TEST 8: Look for existing appointments
      testLog.push('\\nTEST 8: Look for existing appointments');
      console.log('\\n=== TEST 8: Look for existing appointments ===');

      const appointmentSelectors = ['.appointment', '[data-appointment]', '[class*="event"]', '[class*="booking"]'];
      let appointmentsFound = 0;

      for (const selector of appointmentSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          appointmentsFound = count;
          testLog.push(`✓ Found ${count} appointments with selector ${selector}`);
          console.log(`✓ Found ${count} appointments with selector ${selector}`);

          // Try clicking first appointment
          try {
            await page.locator(selector).first().click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'qa-screenshots/12-appointment-clicked.png', fullPage: true });
            testLog.push(`✓ Clicked appointment successfully`);
            console.log(`✓ Clicked appointment successfully`);
          } catch (error) {
            testLog.push(`✗ Failed to click appointment: ${error.message}`);
            console.log(`✗ Failed to click appointment: ${error.message}`);
          }
          break;
        }
      }

      if (appointmentsFound === 0) {
        testLog.push('⚠ No existing appointments found on calendar');
        console.log('⚠ No existing appointments found on calendar');
      }

    } else {
      bugReport.bugs.push({
        severity: 'critical',
        type: 'navigation',
        description: 'Calendar page not accessible',
        stepsToReproduce: ['Login', 'Try to navigate to calendar'],
        expectedBehavior: 'Calendar page should be accessible from navigation or direct URL',
        actualBehavior: 'Calendar page cannot be accessed'
      });
    }

    // Final screenshot
    await page.screenshot({ path: 'qa-screenshots/99-final-state.png', fullPage: true });

    // Generate summary report
    console.log('\\n=== CONSOLE ERRORS ===');
    const errors = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    console.log(JSON.stringify(errors, null, 2));

    console.log('\\n=== NETWORK FAILURES ===');
    console.log(JSON.stringify(failedRequests, null, 2));

    console.log('\\n=== TEST LOG ===');
    testLog.forEach(log => console.log(log));

    // Save detailed bug report
    bugReport.testLog = testLog;
    bugReport.consoleMessages = consoleMessages;
    bugReport.networkRequests = networkRequests.filter(r => r.status >= 400);
    bugReport.summary = {
      totalBugs: bugReport.bugs.length,
      criticalBugs: bugReport.bugs.filter(b => b.severity === 'critical').length,
      highBugs: bugReport.bugs.filter(b => b.severity === 'high').length,
      mediumBugs: bugReport.bugs.filter(b => b.severity === 'medium').length,
      lowBugs: bugReport.bugs.filter(b => b.severity === 'low').length
    };

    fs.writeFileSync('/Users/ddachkinov/Claude/imamChas-booking/BOOKING_CALENDAR_QA_REPORT.json', JSON.stringify(bugReport, null, 2));
    console.log('\\n=== Bug report saved to BOOKING_CALENDAR_QA_REPORT.json ===');
  });
});
