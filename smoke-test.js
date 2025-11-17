const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSmokeTests() {
  const results = {
    login: { status: 'PENDING', errors: [], screenshots: [] },
    calendar: { status: 'PENDING', errors: [], screenshots: [] },
    services: { status: 'PENDING', errors: [], screenshots: [] },
    staff: { status: 'PENDING', errors: [], screenshots: [] }
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Collect network failures
    const networkFailures = [];
    page.on('requestfailed', request => {
      networkFailures.push(`${request.url()} - ${request.failure().errorText}`);
    });

    // Test 1: Login
    console.log('Test 1: Login...');
    try {
      await page.goto('https://demo.ic-booking.groundpoint.net/', { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for React app to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'test-landing.png' });

      // Click "Sign In" button if on landing page
      const buttons = await page.$$('button, a');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Sign In')) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
      }

      await page.screenshot({ path: 'test-login-page.png' });

      // Wait for login form
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });

      await page.type('input[type="email"], input[name="email"]', 'admin@demo.ic-booking.groundpoint.net');
      await page.type('input[type="password"], input[name="password"]', 'Admin123!');

      await page.screenshot({ path: 'test-login-filled.png' });

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'test-dashboard.png' });

      const url = page.url();
      if (url.includes('/dashboard') || url.includes('/calendar')) {
        results.login.status = 'PASS';
      } else {
        results.login.status = 'FAIL';
        results.login.errors.push(`Expected dashboard/calendar, got: ${url}`);
      }
      results.login.screenshots = ['test-landing.png', 'test-login-page.png', 'test-login-filled.png', 'test-dashboard.png'];
    } catch (error) {
      results.login.status = 'FAIL';
      results.login.errors.push(error.message);
      try {
        await page.screenshot({ path: 'test-login-error.png' });
        results.login.screenshots.push('test-login-error.png');
      } catch {}
    }

    // Test 2: Calendar Page
    console.log('Test 2: Calendar Page...');
    try {
      await page.goto('https://demo.ic-booking.groundpoint.net/calendar', { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for content to load

      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);
      const html = await page.content();

      await page.screenshot({ path: 'test-calendar.png' });

      // Check if page actually loaded content
      const hasContent = bodyText.trim().length > 50; // More generous check
      const isBlank = html.includes('id="root"') && bodyText.trim().length < 20;

      if (hasContent && !isBlank) {
        results.calendar.status = 'PASS';
      } else {
        results.calendar.status = 'FAIL';
        results.calendar.errors.push(`Calendar page is blank or has minimal content. URL: ${url}, Body length: ${bodyText.trim().length}`);
      }
      results.calendar.screenshots = ['test-calendar.png'];
      results.calendar.consoleErrors = [...consoleErrors];
      results.calendar.url = url;
      consoleErrors.length = 0; // Clear for next test
    } catch (error) {
      results.calendar.status = 'FAIL';
      results.calendar.errors.push(error.message);
    }

    // Test 3: Services Page
    console.log('Test 3: Services Page...');
    try {
      await page.goto('https://demo.ic-booking.groundpoint.net/services', { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);

      await page.screenshot({ path: 'test-services.png' });

      if (bodyText.includes('Services') || bodyText.trim().length > 50) {
        results.services.status = 'PASS';
      } else {
        results.services.status = 'FAIL';
        results.services.errors.push(`Services page appears empty. URL: ${url}, Body length: ${bodyText.trim().length}`);
      }
      results.services.screenshots = ['test-services.png'];
      results.services.consoleErrors = [...consoleErrors];
      results.services.url = url;
      consoleErrors.length = 0;
    } catch (error) {
      results.services.status = 'FAIL';
      results.services.errors.push(error.message);
    }

    // Test 4: Staff Page
    console.log('Test 4: Staff Page...');
    try {
      await page.goto('https://demo.ic-booking.groundpoint.net/staff', { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);

      await page.screenshot({ path: 'test-staff.png' });

      if (bodyText.includes('Staff') || bodyText.trim().length > 50) {
        results.staff.status = 'PASS';
      } else {
        results.staff.status = 'FAIL';
        results.staff.errors.push(`Staff page appears empty. URL: ${url}, Body length: ${bodyText.trim().length}`);
      }
      results.staff.screenshots = ['test-staff.png'];
      results.staff.consoleErrors = [...consoleErrors];
      results.staff.url = url;
    } catch (error) {
      results.staff.status = 'FAIL';
      results.staff.errors.push(error.message);
    }

    // Add network failures to results
    results.networkFailures = networkFailures;

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Write results to file
  fs.writeFileSync('smoke-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== SMOKE TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
}

runSmokeTests().catch(console.error);
