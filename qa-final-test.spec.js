const { test, expect } = require('@playwright/test');
const fs = require('fs');

const BASE_URL = 'https://demo.ic-booking.groundpoint.net';
const ADMIN_URL = 'https://demo.ic-booking.groundpoint.net/admin';
const LOGIN_EMAIL = 'admin@example.com';
const LOGIN_PASSWORD = 'admin123';

test.describe('Booking Platform QA - Final Report', () => {

  test('Complete QA Testing with Bug Documentation', async ({ page }) => {
    const bugReport = {
      testDate: new Date().toISOString(),
      environment: BASE_URL,
      bugs: [],
      consoleErrors: [],
      networkErrors: [],
      testResults: []
    };

    // Track console and network
    page.on('console', msg => {
      if (msg.type() === 'error') {
        bugReport.consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      }
    });

    page.on('pageerror', error => {
      bugReport.consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });

    page.on('requestfailed', request => {
      bugReport.networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      });
    });

    page.on('response', async response => {
      if (response.status() >= 400) {
        bugReport.bugs.push({
          severity: response.status() >= 500 ? 'critical' : 'high',
          type: 'API Error',
          description: `HTTP ${response.status()} on ${response.request().method()} ${response.url()}`,
          endpoint: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    console.log('Starting comprehensive QA testing...\n');

    // TEST 1: Landing page
    console.log('TEST 1: Check landing page');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'qa-screenshots/01-landing-page.png', fullPage: true });

    const landingUrl = page.url();
    console.log(`  Current URL: ${landingUrl}`);
    bugReport.testResults.push({
      test: 'Landing Page',
      status: 'completed',
      url: landingUrl,
      screenshot: '01-landing-page.png'
    });

    // TEST 2: Try admin login route
    console.log('\nTEST 2: Navigate to admin login');
    const adminRoutes = [
      '/admin/login',
      '/admin',
      '/login',
      '/auth/login'
    ];

    let loginFormFound = false;
    for (const route of adminRoutes) {
      const url = `${BASE_URL}${route}`;
      console.log(`  Trying: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        // Check for login form
        const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();

        if (emailInput > 0 && passwordInput > 0) {
          console.log(`  ✓ Login form found at ${route}`);
          await page.screenshot({ path: 'qa-screenshots/02-login-form.png', fullPage: true });
          loginFormFound = true;

          bugReport.testResults.push({
            test: 'Admin Login Page',
            status: 'success',
            url: page.url(),
            screenshot: '02-login-form.png'
          });
          break;
        }
      } catch (error) {
        console.log(`  ✗ ${route} failed: ${error.message}`);
      }
    }

    if (!loginFormFound) {
      console.log('  ✗ No login form found on any admin route');
      bugReport.bugs.push({
        severity: 'critical',
        type: 'Authentication',
        description: 'Admin login page not accessible',
        stepsToReproduce: ['Navigate to /admin/login or /admin or /login'],
        expectedBehavior: 'Should show login form with email and password fields',
        actualBehavior: 'Login form not found on any standard admin routes',
        screenshot: '02-login-form.png'
      });
    }

    // TEST 3: Attempt login
    if (loginFormFound) {
      console.log('\nTEST 3: Attempt login');

      try {
        await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
        await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
        await page.screenshot({ path: 'qa-screenshots/03-login-filled.png', fullPage: true });

        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);

        const afterLoginUrl = page.url();
        await page.screenshot({ path: 'qa-screenshots/04-after-login.png', fullPage: true });

        console.log(`  After login URL: ${afterLoginUrl}`);

        if (afterLoginUrl.includes('login')) {
          console.log('  ⚠ Still on login page after submission');

          // Check for errors
          const errors = await page.locator('.error, [role="alert"], .text-red-500').allTextContents();
          if (errors.length > 0) {
            console.log(`  Error messages: ${errors.join(', ')}`);
          }

          bugReport.bugs.push({
            severity: 'critical',
            type: 'Authentication',
            description: 'Login does not redirect after submission',
            stepsToReproduce: [
              'Navigate to admin login',
              `Fill email: ${LOGIN_EMAIL}`,
              'Fill password',
              'Click submit'
            ],
            expectedBehavior: 'Should redirect to dashboard after successful login',
            actualBehavior: 'Remains on login page, no redirect occurs',
            errorMessages: errors,
            screenshot: '04-after-login.png'
          });
        } else {
          console.log('  ✓ Successfully redirected after login');
          bugReport.testResults.push({
            test: 'Login Success',
            status: 'success',
            url: afterLoginUrl
          });
        }
      } catch (error) {
        console.log(`  ✗ Login failed: ${error.message}`);
        bugReport.bugs.push({
          severity: 'critical',
          type: 'Authentication',
          description: 'Login process error',
          error: error.message
        });
      }
    }

    // TEST 4: Direct calendar access
    console.log('\nTEST 4: Access calendar directly');

    const calendarUrls = [
      '/calendar',
      '/admin/calendar',
      '/bookings',
      '/admin/bookings'
    ];

    let calendarLoaded = false;
    for (const route of calendarUrls) {
      const url = `${BASE_URL}${route}`;
      console.log(`  Trying: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);

        const content = await page.content();
        const hasCalendar = content.includes('calendar') || content.includes('Calendar') ||
                           content.includes('appointment') || content.includes('booking');

        if (hasCalendar || !content.includes('404')) {
          console.log(`  ✓ Calendar page accessible at ${route}`);
          await page.screenshot({ path: `qa-screenshots/05-calendar-${route.replace(/\//g, '-')}.png`, fullPage: true });
          calendarLoaded = true;

          // Check for calendar components
          const components = {
            'New Appointment': await page.locator('button:has-text("New Appointment"), button:has-text("New Booking")').count(),
            'Previous Button': await page.locator('button:has-text("Previous"), button:has-text("Prev")').count(),
            'Next Button': await page.locator('button:has-text("Next")').count(),
            'Today Button': await page.locator('button:has-text("Today")').count(),
            'Week View': await page.locator('button:has-text("Week")').count(),
            'Day View': await page.locator('button:has-text("Day")').count(),
            'Month View': await page.locator('button:has-text("Month")').count()
          };

          console.log('  Calendar components found:');
          for (const [name, count] of Object.entries(components)) {
            console.log(`    ${name}: ${count > 0 ? '✓' : '✗'}`);

            if (count === 0) {
              bugReport.bugs.push({
                severity: 'medium',
                type: 'UI Component Missing',
                description: `Calendar component not found: ${name}`,
                stepsToReproduce: [`Navigate to ${url}`],
                expectedBehavior: `${name} should be visible on calendar page`,
                actualBehavior: `${name} not found in DOM`
              });
            }
          }

          bugReport.testResults.push({
            test: 'Calendar Page Access',
            status: 'success',
            url: page.url(),
            components: components
          });

          break;
        }
      } catch (error) {
        console.log(`  ✗ ${route} failed: ${error.message}`);
      }
    }

    if (!calendarLoaded) {
      bugReport.bugs.push({
        severity: 'critical',
        type: 'Navigation',
        description: 'Calendar page not accessible',
        stepsToReproduce: ['Try to access /calendar, /admin/calendar, /bookings, /admin/bookings'],
        expectedBehavior: 'Calendar page should be accessible',
        actualBehavior: 'Calendar page returns 404 or blank page on all routes'
      });
    }

    // TEST 5: Test New Appointment button (if calendar loaded)
    if (calendarLoaded) {
      console.log('\nTEST 5: Test New Appointment button');

      const newApptButton = page.locator('button:has-text("New Appointment"), button:has-text("New Booking"), button:has-text("Create")').first();

      if (await newApptButton.count() > 0) {
        try {
          await page.screenshot({ path: 'qa-screenshots/06-before-new-appointment.png', fullPage: true });

          await newApptButton.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'qa-screenshots/07-after-new-appointment.png', fullPage: true });

          // Check if modal appeared
          const modal = await page.locator('[role="dialog"], .modal, form').count();

          if (modal > 0) {
            console.log('  ✓ Booking form modal appeared');
            bugReport.testResults.push({
              test: 'New Appointment Button',
              status: 'success'
            });
          } else {
            console.log('  ✗ No modal appeared after clicking button');
            bugReport.bugs.push({
              severity: 'high',
              type: 'Functionality',
              description: 'New Appointment button does not open booking form',
              stepsToReproduce: ['Navigate to calendar', 'Click "New Appointment" button'],
              expectedBehavior: 'Booking form modal should appear',
              actualBehavior: 'Button clicks but no form appears',
              screenshot: '07-after-new-appointment.png'
            });
          }
        } catch (error) {
          console.log(`  ✗ New Appointment button error: ${error.message}`);
          bugReport.bugs.push({
            severity: 'critical',
            type: 'Functionality',
            description: 'New Appointment button causes error',
            error: error.message,
            screenshot: '07-after-new-appointment.png'
          });
        }
      } else {
        console.log('  ⚠ New Appointment button not found');
      }
    }

    // TEST 6: Check for console errors
    console.log('\nTEST 6: Console and Network Errors');
    console.log(`  Console errors found: ${bugReport.consoleErrors.length}`);
    console.log(`  Network failures found: ${bugReport.networkErrors.length}`);

    if (bugReport.consoleErrors.length > 0) {
      console.log('  Console errors:');
      bugReport.consoleErrors.forEach(err => {
        console.log(`    - ${err.text || err.message}`);
      });
    }

    if (bugReport.networkErrors.length > 0) {
      console.log('  Network failures:');
      bugReport.networkErrors.forEach(err => {
        console.log(`    - ${err.method} ${err.url}: ${err.failure?.errorText || 'failed'}`);
      });
    }

    // Final screenshot
    await page.screenshot({ path: 'qa-screenshots/99-final-state.png', fullPage: true });

    // Generate summary
    bugReport.summary = {
      totalBugs: bugReport.bugs.length,
      critical: bugReport.bugs.filter(b => b.severity === 'critical').length,
      high: bugReport.bugs.filter(b => b.severity === 'high').length,
      medium: bugReport.bugs.filter(b => b.severity === 'medium').length,
      low: bugReport.bugs.filter(b => b.severity === 'low').length,
      consoleErrors: bugReport.consoleErrors.length,
      networkErrors: bugReport.networkErrors.length
    };

    console.log('\n=== SUMMARY ===');
    console.log(`Total Bugs: ${bugReport.summary.totalBugs}`);
    console.log(`  Critical: ${bugReport.summary.critical}`);
    console.log(`  High: ${bugReport.summary.high}`);
    console.log(`  Medium: ${bugReport.summary.medium}`);
    console.log(`  Low: ${bugReport.summary.low}`);
    console.log(`Console Errors: ${bugReport.summary.consoleErrors}`);
    console.log(`Network Errors: ${bugReport.summary.networkErrors}`);

    // Save report
    fs.writeFileSync(
      '/Users/ddachkinov/Claude/imamChas-booking/BOOKING_CALENDAR_QA_REPORT.json',
      JSON.stringify(bugReport, null, 2)
    );

    console.log('\n✓ Full bug report saved to BOOKING_CALENDAR_QA_REPORT.json');
  });
});
