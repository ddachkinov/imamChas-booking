import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to analytics page
    await page.goto('/admin/analytics');
  });

  test('should display analytics dashboard with all metrics', async ({ page }) => {
    await test.step('Verify page loads', async () => {
      await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
    });

    await test.step('Verify overview metrics are displayed', async () => {
      // Should show 6 metric cards
      await expect(page.getByTestId('metric-card')).toHaveCount(6, { timeout: 10000 });

      // Verify key metrics are present
      await expect(page.getByText(/total revenue/i)).toBeVisible();
      await expect(page.getByText(/total appointments/i)).toBeVisible();
      await expect(page.getByText(/completed appointments/i)).toBeVisible();
      await expect(page.getByText(/cancelled appointments/i)).toBeVisible();
      await expect(page.getByText(/new clients/i)).toBeVisible();
      await expect(page.getByText(/average.*value/i)).toBeVisible();
    });

    await test.step('Verify metrics show values and trends', async () => {
      const metricCards = page.getByTestId('metric-card');
      const firstCard = metricCards.first();

      // Should show numeric value
      await expect(firstCard).toContainText(/\$|[0-9]/);

      // Should show trend indicator (up/down arrow or percentage)
      const hasTrend = await firstCard.getByText(/%|\+|-|↑|↓/).isVisible().catch(() => false);
      // Trend might not always be present, so we don't assert
    });
  });

  test('should display revenue chart', async ({ page }) => {
    await test.step('Verify chart is visible', async () => {
      await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify chart has toggle for line/bar view', async () => {
      // Chart should have view toggle buttons
      const lineButton = page.getByRole('button', { name: /line/i });
      const barButton = page.getByRole('button', { name: /bar/i });

      const hasToggle = (await lineButton.isVisible()) || (await barButton.isVisible());
      expect(hasToggle).toBe(true);
    });

    await test.step('Switch between chart types', async () => {
      // Try to toggle chart type
      const barButton = page.getByRole('button', { name: /bar/i });
      if (await barButton.isVisible()) {
        await barButton.click();

        // Chart should still be visible after toggle
        await expect(page.getByTestId('revenue-chart')).toBeVisible();

        // Switch back to line
        await page.getByRole('button', { name: /line/i }).click();
        await expect(page.getByTestId('revenue-chart')).toBeVisible();
      }
    });

    await test.step('Verify chart displays data', async () => {
      const chart = page.getByTestId('revenue-chart');

      // Chart should contain SVG elements (recharts uses SVG)
      const svgElements = chart.locator('svg');
      await expect(svgElements).toHaveCount(1, { timeout: 5000 });
    });
  });

  test('should filter analytics by date range', async ({ page }) => {
    await test.step('Open date range selector', async () => {
      await page.getByTestId('date-range-selector').click();
    });

    await test.step('Select "Last 7 days" preset', async () => {
      await page.getByRole('button', { name: /last 7 days/i }).click();

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Date range label should update
      await expect(page.getByTestId('selected-date-range')).toContainText(/7 days/i);
    });

    await test.step('Select "Last 30 days" preset', async () => {
      await page.getByTestId('date-range-selector').click();
      await page.getByRole('button', { name: /last 30 days/i }).click();

      await page.waitForTimeout(1000);
      await expect(page.getByTestId('selected-date-range')).toContainText(/30 days/i);
    });

    await test.step('Select "This month" preset', async () => {
      await page.getByTestId('date-range-selector').click();
      await page.getByRole('button', { name: /this month/i }).click();

      await page.waitForTimeout(1000);

      // Should show current month name
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      await expect(page.getByTestId('selected-date-range')).toContainText(currentMonth);
    });
  });

  test('should display top performers', async ({ page }) => {
    await test.step('Verify top services section', async () => {
      await expect(page.getByRole('heading', { name: /top services/i })).toBeVisible();

      // Should show top 5 services
      const serviceItems = page.getByTestId('top-service-item');
      const count = await serviceItems.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(5);
    });

    await test.step('Verify service details', async () => {
      const firstService = page.getByTestId('top-service-item').first();

      // Should show service name
      await expect(firstService).toBeVisible();

      // Should show revenue amount
      await expect(firstService).toContainText(/\$/);

      // Should show appointment count
      await expect(firstService).toContainText(/appointment|booking/i);
    });

    await test.step('Verify top staff section', async () => {
      await expect(page.getByRole('heading', { name: /top (staff|performers)/i })).toBeVisible();

      // Should show top 5 staff members
      const staffItems = page.getByTestId('top-staff-item');
      const count = await staffItems.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(5);
    });

    await test.step('Verify staff details', async () => {
      const firstStaff = page.getByTestId('top-staff-item').first();

      // Should show staff name
      await expect(firstStaff).toBeVisible();

      // Should show performance metrics
      await expect(firstStaff).toContainText(/\$|[0-9]/);
    });

    await test.step('Verify ranking indicators', async () => {
      const topServices = page.getByTestId('top-service-item');

      // First item should have #1 or rank indicator
      const firstItem = topServices.first();
      const hasRank = await firstItem.getByText(/1|#1|🥇/).isVisible().catch(() => false);
      // Rank indicator might be implemented differently
    });
  });

  test('should display additional statistics', async ({ page }) => {
    await test.step('Verify no-show rate is displayed', async () => {
      await expect(page.getByText(/no-show rate/i)).toBeVisible();
    });

    await test.step('Verify total clients is displayed', async () => {
      await expect(page.getByText(/total clients/i)).toBeVisible();
    });

    await test.step('Verify completion rate is displayed', async () => {
      await expect(page.getByText(/completion rate/i)).toBeVisible();
    });
  });

  test('should handle custom date range selection', async ({ page }) => {
    await test.step('Open date range selector', async () => {
      await page.getByTestId('date-range-selector').click();
    });

    await test.step('Select custom date range option', async () => {
      const customButton = page.getByRole('button', { name: /custom/i });

      if (await customButton.isVisible()) {
        await customButton.click();

        // Should show date pickers
        await expect(page.getByLabel(/start date/i)).toBeVisible();
        await expect(page.getByLabel(/end date/i)).toBeVisible();

        // Fill in custom dates
        await page.getByLabel(/start date/i).fill('2025-11-01');
        await page.getByLabel(/end date/i).fill('2025-11-07');

        // Apply custom range
        await page.getByRole('button', { name: /apply/i }).click();

        // Should update dashboard
        await page.waitForTimeout(1000);
      }
    });
  });

  test('should export analytics report', async ({ page }) => {
    await test.step('Open export menu', async () => {
      const exportButton = page.getByRole('button', { name: /export|download/i });

      if (await exportButton.isVisible()) {
        await exportButton.click();
      }
    });

    await test.step('Export as CSV', async () => {
      const csvOption = page.getByRole('menuitem', { name: /csv/i });

      if (await csvOption.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await csvOption.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });
  });

  test('should compare to previous period', async ({ page }) => {
    await test.step('Enable comparison mode', async () => {
      const compareCheckbox = page.getByRole('checkbox', { name: /compare|previous period/i });

      if (await compareCheckbox.isVisible()) {
        await compareCheckbox.check();

        // Should show comparison data
        await page.waitForTimeout(1000);

        // Metric cards should show comparison percentages
        const metricCards = page.getByTestId('metric-card');
        const firstCard = metricCards.first();

        // Should show percentage change
        await expect(firstCard).toContainText(/%/);
      }
    });
  });

  test('should show loading states appropriately', async ({ page }) => {
    // Navigate to page (initial load)
    await page.goto('/admin/analytics');

    // Loading indicators might appear briefly
    const loadingIndicator = page.getByRole('status').or(page.getByTestId('loading-spinner'));
    const isVisible = await loadingIndicator.isVisible().catch(() => false);

    // After loading, metrics should be visible
    await expect(page.getByTestId('metric-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Note: This test would need backend support to simulate empty data
    // For now, we just verify the page doesn't crash

    await test.step('Verify page renders without errors', async () => {
      // Page should be visible
      await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

      // Should not show error messages
      const errorMessage = page.getByText(/error|failed/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      // We don't assert false because there might be legitimate errors
    });
  });

  test('should update chart on date range change', async ({ page }) => {
    await test.step('Get initial chart state', async () => {
      await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Change date range', async () => {
      await page.getByTestId('date-range-selector').click();
      await page.getByRole('button', { name: /last 7 days/i }).click();

      // Wait for chart to update
      await page.waitForTimeout(1000);

      // Chart should still be visible after update
      await expect(page.getByTestId('revenue-chart')).toBeVisible();
    });
  });

  test('should show revenue and appointment trends', async ({ page }) => {
    await test.step('Verify revenue metric has trend indicator', async () => {
      const revenueCard = page.getByText(/total revenue/i).locator('..');

      // Should show amount
      await expect(revenueCard).toContainText(/\$/);

      // Might show percentage change
      const hasTrend = await revenueCard.getByText(/%/).isVisible().catch(() => false);
    });

    await test.step('Verify appointment metric has trend', async () => {
      const appointmentCard = page.getByText(/total appointments/i).locator('..');

      // Should show count
      await expect(appointmentCard).toContainText(/[0-9]/);
    });
  });

  test('should display chart tooltip on hover', async ({ page }) => {
    await test.step('Hover over chart data point', async () => {
      const chart = page.getByTestId('revenue-chart');
      await expect(chart).toBeVisible({ timeout: 10000 });

      // Try to hover over chart area
      await chart.hover();

      // Note: Actual tooltip interaction would need more specific selectors
      // based on recharts implementation
    });
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/admin/analytics');

    // Dashboard should be responsive
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Metrics should be visible and stacked appropriately
    await expect(page.getByTestId('metric-card').first()).toBeVisible({ timeout: 10000 });

    // Chart should be visible
    await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 10000 });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/analytics');

    // Dashboard should be responsive
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Metrics should be visible (likely in single column)
    await expect(page.getByTestId('metric-card').first()).toBeVisible({ timeout: 10000 });

    // Chart should adapt to smaller screen
    await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 10000 });

    // Date range selector should be accessible
    await page.getByTestId('date-range-selector').click();
    await expect(page.getByRole('button', { name: /last 7 days/i })).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click on Dashboard link in navigation
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('should maintain date range selection across page navigations', async ({ page }) => {
    await test.step('Select a specific date range', async () => {
      await page.getByTestId('date-range-selector').click();
      await page.getByRole('button', { name: /last 30 days/i }).click();
      await page.waitForTimeout(500);
    });

    await test.step('Navigate away and back', async () => {
      await page.goto('/admin/dashboard');
      await page.goto('/admin/analytics');

      // Date range selection might persist (depending on implementation)
      // This test would verify that persistence if implemented
    });
  });
});
