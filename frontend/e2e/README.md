# End-to-End (E2E) Testing Guide

This directory contains E2E tests for the booking platform using Playwright.

## Setup

### Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Install Browsers

Playwright will download Chromium, Firefox, and WebKit browsers:

```bash
npx playwright install
```

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Run specific test file

```bash
npx playwright test e2e/booking-flow.spec.ts
```

### Run tests in specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

## Test Organization

### Test Files

- `booking-flow.spec.ts` - Customer booking wizard E2E tests
- `admin-appointments.spec.ts` - Admin calendar and appointment management tests
- `helpers.ts` - Shared test utilities and helper functions

### Test Structure

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    await test.step('Step 1', async () => {
      // Test logic
    });

    await test.step('Step 2', async () => {
      // More test logic
    });
  });
});
```

## Helper Functions

Use helper functions from `helpers.ts` for common operations:

```typescript
import { loginAsAdmin, navigateToCalendar, createAppointment } from './helpers';

test('example test', async ({ page }) => {
  await loginAsAdmin(page);
  await navigateToCalendar(page);
  await createAppointment(page, {
    client: 'John Doe',
    service: 'Haircut',
    staff: 'Jane Smith',
    date: '2025-11-15',
    time: '10:00',
  });
});
```

## Test Data Attributes

Use `data-testid` attributes for stable element selection:

```tsx
// In component
<div data-testid="appointment-block">...</div>

// In test
await page.getByTestId('appointment-block').click();
```

## Best Practices

### 1. Use Test Steps

Break tests into logical steps for better readability:

```typescript
test('complete booking flow', async ({ page }) => {
  await test.step('Select service', async () => {
    // Service selection logic
  });

  await test.step('Select date and time', async () => {
    // Date/time selection logic
  });
});
```

### 2. Wait for Elements

Always wait for elements to be visible before interacting:

```typescript
await page.waitForSelector('[data-testid="service-card"]', { timeout: 10000 });
```

### 3. Use Meaningful Assertions

Use descriptive assertions:

```typescript
await expect(page.getByRole('heading', { name: /booking confirmed/i })).toBeVisible();
```

### 4. Test in Multiple Viewports

Test responsive behavior:

```typescript
test('mobile booking', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Test mobile-specific behavior
});
```

### 5. Clean Up After Tests

Ensure tests don't affect each other:

```typescript
test.afterEach(async ({ page }) => {
  // Logout or reset state
  await logout(page);
});
```

## Test Coverage

### Booking Flow Tests

- ✅ Complete booking wizard (all steps)
- ✅ Service category filtering
- ✅ Back navigation between steps
- ✅ Returning customer detection
- ✅ Form validation
- ✅ State persistence on page refresh
- ✅ Loading states
- ✅ Booking summary display
- ✅ Mobile responsiveness

### Admin Appointment Tests

- ✅ Calendar display and navigation
- ✅ View switching (day/week/month)
- ✅ Date navigation (next/previous/today)
- ✅ Appointment details viewing
- ✅ Status updates
- ✅ Filtering by status
- ✅ Appointment search
- ✅ Quick appointment creation
- ✅ Calendar export (iCal/CSV/Print)
- ✅ Keyboard shortcuts
- ✅ Metrics display
- ✅ Sidebar interaction
- ✅ Tablet responsiveness

## Debugging Tests

### View Test Report

```bash
npx playwright show-report
```

### View Trace

When a test fails, Playwright captures a trace:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture screenshots and videos:
- Screenshots: `test-results/`
- Videos: `test-results/`

### Inspector

Run tests with Playwright Inspector:

```bash
npx playwright test --debug
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Writing New Tests

### 1. Create Test File

```bash
touch e2e/my-feature.spec.ts
```

### 2. Write Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature');

    // Test logic
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### 3. Run Test

```bash
npx playwright test e2e/my-feature.spec.ts
```

### 4. Add Helper Function (if needed)

```typescript
// In helpers.ts
export async function myHelper(page: Page, param: string) {
  // Helper logic
}

// In test
import { myHelper } from './helpers';

test('test with helper', async ({ page }) => {
  await myHelper(page, 'value');
});
```

## Common Selectors

### By Role

```typescript
page.getByRole('button', { name: /submit/i });
page.getByRole('heading', { name: /welcome/i });
page.getByRole('textbox', { name: /email/i });
```

### By Test ID

```typescript
page.getByTestId('appointment-block');
page.getByTestId('calendar-view');
```

### By Label

```typescript
page.getByLabel(/first name/i);
page.getByLabel(/email address/i);
```

### By Text

```typescript
page.getByText(/booking confirmed/i);
page.getByText('Exact text');
```

### By Placeholder

```typescript
page.getByPlaceholder(/search/i);
```

## Troubleshooting

### Tests are flaky

- Add explicit waits: `await page.waitForSelector()`
- Increase timeouts: `{ timeout: 10000 }`
- Use `waitFor()` instead of `waitForTimeout()`

### Elements not found

- Check if element has `data-testid` attribute
- Verify element is actually rendered
- Check if element is hidden by CSS
- Wait for element: `await element.waitFor()`

### Tests pass locally but fail in CI

- Check viewport size
- Ensure all resources load (images, fonts)
- Check network conditions
- Verify test data availability

### Slow tests

- Run tests in parallel: `--workers=4`
- Use `--project` to run specific browser only
- Optimize test data setup
- Use helper functions to reduce duplication

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Library](https://testing-library.com/docs/queries/about)
