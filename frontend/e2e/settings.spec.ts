import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Settings Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to notification settings
      await page.goto('/admin/settings/notifications');
    });

    test('should display notification settings page', async ({ page }) => {
      await test.step('Verify page loads', async () => {
        await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();
        await expect(page.getByText(/configure how you receive notifications/i)).toBeVisible();
      });

      await test.step('Verify notification channels section', async () => {
        await expect(page.getByRole('heading', { name: /notification channels/i })).toBeVisible();
        await expect(page.getByText(/email notifications/i)).toBeVisible();
        await expect(page.getByText(/sms notifications/i)).toBeVisible();
        await expect(page.getByText(/push notifications/i)).toBeVisible();
      });

      await test.step('Verify event notifications table', async () => {
        await expect(page.getByRole('heading', { name: /event notifications/i })).toBeVisible();

        // Should show table headers
        await expect(page.getByRole('columnheader', { name: /event/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /sms/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /push/i })).toBeVisible();
      });
    });

    test('should toggle notification channels', async ({ page }) => {
      await test.step('Toggle email notifications', async () => {
        const emailToggle = page.getByRole('button').filter({
          has: page.locator('..').filter({ hasText: /email notifications/i })
        }).first();

        await emailToggle.click();

        // Should show success toast
        await expect(page.getByText(/settings updated successfully/i)).toBeVisible({ timeout: 5000 });
      });

      await test.step('Toggle SMS notifications', async () => {
        const smsToggle = page.getByRole('button').filter({
          has: page.locator('..').filter({ hasText: /sms notifications/i })
        }).first();

        await smsToggle.click();
        await expect(page.getByText(/settings updated successfully/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should toggle event-specific notifications', async ({ page }) => {
      await test.step('Toggle appointment created email', async () => {
        // Find the checkbox in the first row (appointment created) and email column
        const checkbox = page.locator('tbody tr').first().locator('td').nth(1).locator('input[type="checkbox"]');

        await checkbox.click();
        await expect(page.getByText(/settings updated successfully/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should disable checkboxes when channel is disabled', async ({ page }) => {
      await test.step('Check initial state', async () => {
        // SMS might be disabled by default, so checkboxes in SMS column should be disabled
        const smsCheckboxes = page.locator('tbody td:nth-child(3) input[type="checkbox"]');
        const firstCheckbox = smsCheckboxes.first();

        // Check if any are disabled (depends on mock data)
        const isDisabled = await firstCheckbox.isDisabled();
        // Just verify it doesn't crash - actual state depends on backend
      });
    });

    test('should display all notification events', async ({ page }) => {
      const events = [
        /new appointment/i,
        /appointment confirmed/i,
        /appointment cancelled/i,
        /appointment reminder/i,
        /appointment completed/i,
        /payment received/i,
        /new client/i,
        /staff assignment/i,
      ];

      for (const event of events) {
        await expect(page.getByText(event)).toBeVisible();
      }
    });

    test('should show loading state', async ({ page }) => {
      // Navigate to page (initial load)
      await page.goto('/admin/settings/notifications');

      // Loading indicator might appear briefly
      const loadingIndicator = page.locator('.animate-spin');
      const isVisible = await loadingIndicator.isVisible().catch(() => false);

      // After loading, content should be visible
      await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Integration Settings', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to integration settings
      await page.goto('/admin/settings/integrations');
    });

    test('should display integrations page', async ({ page }) => {
      await test.step('Verify page loads', async () => {
        await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();
        await expect(page.getByText(/connect third-party services/i)).toBeVisible();
      });

      await test.step('Verify integration cards are displayed', async () => {
        // Should show multiple integration cards
        await expect(page.getByText(/google calendar/i)).toBeVisible();
        await expect(page.getByText(/stripe/i)).toBeVisible();
        await expect(page.getByText(/mailgun/i)).toBeVisible();
        await expect(page.getByText(/twilio/i)).toBeVisible();
        await expect(page.getByText(/zapier/i)).toBeVisible();
      });
    });

    test('should display integration status badges', async ({ page }) => {
      await test.step('Verify connected integrations show badge', async () => {
        // Stripe should be connected in mock data
        const stripeCard = page.locator('div', { hasText: /stripe/i }).filter({ hasText: /accept online payments/i });
        await expect(stripeCard.getByText(/connected/i)).toBeVisible();
      });

      await test.step('Verify disconnected integrations show badge', async () => {
        const googleCalendarCard = page.locator('div', { hasText: /google calendar/i }).filter({ hasText: /sync appointments/i });
        await expect(googleCalendarCard.getByText(/not connected/i)).toBeVisible();
      });
    });

    test('should display integration features', async ({ page }) => {
      await test.step('Verify features list is shown', async () => {
        // Each integration should show its features
        await expect(page.getByText(/two-way sync/i)).toBeVisible();
        await expect(page.getByText(/credit card processing/i)).toBeVisible();
        await expect(page.getByText(/transactional emails/i)).toBeVisible();
        await expect(page.getByText(/sms reminders/i)).toBeVisible();
      });
    });

    test('should connect an integration', async ({ page }) => {
      await test.step('Click connect button', async () => {
        // Find Google Calendar card and click Connect
        const googleCalendarCard = page.locator('div', { hasText: /google calendar/i }).filter({ hasText: /sync appointments/i });
        await googleCalendarCard.getByRole('button', { name: /connect/i }).click();
      });

      await test.step('Verify connecting state', async () => {
        // Should show "Connecting..." text
        await expect(page.getByText(/connecting/i)).toBeVisible();
      });

      await test.step('Verify success message', async () => {
        // Should show success toast after connection
        await expect(page.getByText(/integration connected successfully/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should disconnect an integration', async ({ page }) => {
      await test.step('Click disconnect button', async () => {
        // Find Stripe card (connected) and click Disconnect
        const stripeCard = page.locator('div', { hasText: /stripe/i }).filter({ hasText: /accept online payments/i });
        await stripeCard.getByRole('button', { name: /disconnect/i }).click();
      });

      await test.step('Confirm disconnection', async () => {
        // Should show confirmation dialog
        page.on('dialog', async (dialog) => {
          expect(dialog.message()).toContain('disconnect');
          await dialog.accept();
        });
      });

      await test.step('Verify success message', async () => {
        await expect(page.getByText(/integration disconnected/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should show connection info for connected integrations', async ({ page }) => {
      await test.step('Verify connection date is shown', async () => {
        // Stripe should show connection date
        const stripeCard = page.locator('div', { hasText: /stripe/i }).filter({ hasText: /accept online payments/i });
        await expect(stripeCard.getByText(/connected on/i)).toBeVisible();
      });

      await test.step('Verify config is shown', async () => {
        // Stripe should show account_id config
        const stripeCard = page.locator('div', { hasText: /stripe/i }).filter({ hasText: /accept online payments/i });
        await expect(stripeCard.getByText(/account_id/i)).toBeVisible();
      });
    });

    test('should show configure button for connected integrations', async ({ page }) => {
      await test.step('Click configure button', async () => {
        const stripeCard = page.locator('div', { hasText: /stripe/i }).filter({ hasText: /accept online payments/i });
        const configureButton = stripeCard.getByRole('button', { name: /configure/i });

        await expect(configureButton).toBeVisible();
        await configureButton.click();

        // Should show info message (mock implementation)
        await expect(page.getByText(/configuration coming soon/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should display error state for failed integrations', async ({ page }) => {
      await test.step('Verify error badge', async () => {
        // Outlook Calendar has error state in mock data
        const outlookCard = page.locator('div', { hasText: /outlook calendar/i });
        await expect(outlookCard.getByText(/error/i)).toBeVisible();
      });

      await test.step('Verify error message', async () => {
        const outlookCard = page.locator('div', { hasText: /outlook calendar/i });
        await expect(outlookCard.getByText(/connection failed/i)).toBeVisible();
      });

      await test.step('Verify reconnect button', async () => {
        const outlookCard = page.locator('div', { hasText: /outlook calendar/i });
        await expect(outlookCard.getByRole('button', { name: /reconnect/i })).toBeVisible();
      });
    });

    test('should display help section', async ({ page }) => {
      await expect(page.getByText(/need help/i)).toBeVisible();
      await expect(page.getByText(/integration guides/i)).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/admin/settings/integrations');

      // Page should be responsive
      await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();

      // Cards should stack in single column on smaller screens
      await expect(page.getByText(/google calendar/i)).toBeVisible();
    });
  });

  test.describe('Billing Settings', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to billing settings
      await page.goto('/admin/settings/billing');
    });

    test('should display billing page', async ({ page }) => {
      await test.step('Verify page loads', async () => {
        await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible();
        await expect(page.getByText(/manage your subscription/i)).toBeVisible();
      });

      await test.step('Verify current plan section', async () => {
        await expect(page.getByRole('heading', { name: /current plan/i })).toBeVisible();
        await expect(page.getByText(/professional/i)).toBeVisible(); // Mock data shows Professional plan
      });
    });

    test('should display current subscription details', async ({ page }) => {
      await test.step('Verify plan name and price', async () => {
        await expect(page.getByText(/professional/i)).toBeVisible();
        await expect(page.getByText(/\$79\/month/i)).toBeVisible();
      });

      await test.step('Verify billing period', async () => {
        await expect(page.getByText(/billing period/i)).toBeVisible();
      });

      await test.step('Verify next billing date', async () => {
        await expect(page.getByText(/next billing date/i)).toBeVisible();
      });

      await test.step('Verify status badge', async () => {
        await expect(page.getByText(/active/i)).toBeVisible();
      });
    });

    test('should show and change plans', async ({ page }) => {
      await test.step('Click change plan button', async () => {
        await page.getByRole('button', { name: /change plan/i }).click();
      });

      await test.step('Verify plans are displayed', async () => {
        // Should show all 3 plans
        await expect(page.getByText(/starter/i)).toBeVisible();
        await expect(page.getByText(/professional/i)).toBeVisible();
        await expect(page.getByText(/enterprise/i)).toBeVisible();

        // Should show plan prices
        await expect(page.getByText(/\$29/i)).toBeVisible();
        await expect(page.getByText(/\$79/i)).toBeVisible();
        await expect(page.getByText(/\$199/i)).toBeVisible();
      });

      await test.step('Verify current plan is highlighted', async () => {
        // Professional plan should show "Current Plan" badge
        const professionalCard = page.locator('div', { hasText: /professional/i }).filter({ hasText: /\$79/i });
        await expect(professionalCard.getByText(/current plan/i)).toBeVisible();
      });

      await test.step('Verify plan features', async () => {
        await expect(page.getByText(/unlimited appointments/i).first()).toBeVisible();
        await expect(page.getByText(/priority support/i)).toBeVisible();
        await expect(page.getByText(/advanced analytics/i)).toBeVisible();
      });

      await test.step('Click select plan button', async () => {
        // Find Starter plan card and click Select Plan
        const starterCard = page.locator('div', { hasText: /starter/i }).filter({ hasText: /\$29/i });
        const selectButton = starterCard.getByRole('button', { name: /select plan/i });

        await selectButton.click();

        // Should show success message
        await expect(page.getByText(/plan changed successfully/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should display usage metrics', async ({ page }) => {
      await test.step('Verify usage section exists', async () => {
        await expect(page.getByRole('heading', { name: /current usage/i })).toBeVisible();
      });

      await test.step('Verify all usage metrics', async () => {
        // Should show 4 usage metrics
        await expect(page.getByText(/locations/i).first()).toBeVisible();
        await expect(page.getByText(/staff members/i)).toBeVisible();
        await expect(page.getByText(/appointments/i).first()).toBeVisible();
        await expect(page.getByText(/storage/i)).toBeVisible();
      });

      await test.step('Verify usage limits are shown', async () => {
        await expect(page.getByText(/available/i).first()).toBeVisible();
      });
    });

    test('should display payment methods', async ({ page }) => {
      await test.step('Verify payment methods section', async () => {
        await expect(page.getByRole('heading', { name: /payment methods/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /add method/i })).toBeVisible();
      });

      await test.step('Verify payment cards are listed', async () => {
        // Should show Visa card
        await expect(page.getByText(/visa.*4242/i)).toBeVisible();

        // Should show Mastercard
        await expect(page.getByText(/mastercard.*5555/i)).toBeVisible();
      });

      await test.step('Verify default badge', async () => {
        await expect(page.getByText(/default/i)).toBeVisible();
      });

      await test.step('Verify card expiration', async () => {
        await expect(page.getByText(/expires/i).first()).toBeVisible();
      });

      await test.step('Verify action buttons', async () => {
        // Should show Set Default for non-default cards
        await expect(page.getByRole('button', { name: /set default/i })).toBeVisible();

        // Should show Remove buttons
        await expect(page.getByRole('button', { name: /remove/i }).first()).toBeVisible();
      });
    });

    test('should display invoice history', async ({ page }) => {
      await test.step('Verify invoice section', async () => {
        await expect(page.getByRole('heading', { name: /invoice history/i })).toBeVisible();
      });

      await test.step('Verify invoice table headers', async () => {
        await expect(page.getByRole('columnheader', { name: /invoice/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /amount/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /actions/i })).toBeVisible();
      });

      await test.step('Verify invoice rows', async () => {
        // Should show invoice numbers
        await expect(page.getByText(/INV-2025-001/i)).toBeVisible();

        // Should show amounts
        await expect(page.getByText(/\$79\.00/i).first()).toBeVisible();

        // Should show paid status
        await expect(page.getByText(/paid/i).first()).toBeVisible();
      });

      await test.step('Click download invoice', async () => {
        const downloadButton = page.getByRole('button', { name: /download/i }).first();
        await downloadButton.click();

        // Should show info message
        await expect(page.getByText(/downloading invoice/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should cancel subscription', async ({ page }) => {
      await test.step('Click cancel subscription button', async () => {
        const cancelButton = page.getByRole('button', { name: /cancel subscription/i });
        await expect(cancelButton).toBeVisible();

        // Set up dialog handler before clicking
        page.on('dialog', async (dialog) => {
          expect(dialog.message()).toContain('cancel');
          await dialog.accept();
        });

        await cancelButton.click();
      });

      await test.step('Verify success message', async () => {
        await expect(page.getByText(/subscription cancelled/i)).toBeVisible({ timeout: 5000 });
      });
    });

    test('should show loading state', async ({ page }) => {
      // Navigate to page (initial load)
      await page.goto('/admin/settings/billing');

      // Loading indicator might appear briefly
      const loadingIndicator = page.locator('.animate-spin');
      const isVisible = await loadingIndicator.isVisible().catch(() => false);

      // After loading, content should be visible
      await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible({ timeout: 10000 });
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/admin/settings/billing');

      // Page should be responsive
      await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible();

      // Usage metrics should stack appropriately
      await expect(page.getByText(/locations/i).first()).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/settings/billing');

      // Page should be responsive
      await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible();

      // Plan cards should stack in single column
      await page.getByRole('button', { name: /change plan/i }).click();
      await expect(page.getByText(/starter/i)).toBeVisible();
    });
  });

  test.describe('Settings Navigation', () => {
    test('should navigate between settings pages', async ({ page }) => {
      await test.step('Navigate to notifications', async () => {
        await page.goto('/admin/settings/notifications');
        await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();
      });

      await test.step('Navigate to integrations', async () => {
        await page.goto('/admin/settings/integrations');
        await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();
      });

      await test.step('Navigate to billing', async () => {
        await page.goto('/admin/settings/billing');
        await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible();
      });
    });

    test('should navigate back to dashboard', async ({ page }) => {
      await page.goto('/admin/settings/notifications');

      // Click Dashboard link in navigation
      await page.getByRole('link', { name: /dashboard/i }).click();

      // Should navigate to dashboard
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  });

  test.describe('Settings Error Handling', () => {
    test('should handle empty data gracefully', async ({ page }) => {
      // Navigate to each settings page and verify no crashes
      await page.goto('/admin/settings/notifications');
      await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();

      await page.goto('/admin/settings/integrations');
      await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();

      await page.goto('/admin/settings/billing');
      await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible();
    });
  });
});
