/**
 * BUG-004: Dashboard stats fail silently — no error shown to user
 * Files: src/hooks/useDashboard.ts:64-78, src/pages/Dashboard.tsx:63
 *
 * Root cause: When the /api/bookings/stats endpoint fails, useDashboardStats
 * catches the error internally and returns zeros as a fallback. It does not
 * expose an `isError` flag. Dashboard.tsx never checks for an error state,
 * so the user sees all-zero stats with no indication that data failed to load.
 *
 * Fix:
 *   1. Remove the try/catch in useDashboardStats (let react-query own the error)
 *      OR re-throw after logging so `isError` is set to true.
 *   2. In Dashboard.tsx, read `isError` from useDashboardStats and render an
 *      error message / toast when it is true.
 *
 * These tests FAIL before the fix and PASS after.
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

test.describe('BUG-004: Dashboard stats error state visibility', () => {
  const testUser = {
    email: `bug004-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'BUG004 Client',
    role: 'client',
  };

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: testUser,
    });
    if (res.status() !== 201) {
      console.log('User already exists — continuing.');
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('dashboard should show error message when stats API returns 500', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // --- force the stats endpoint to fail ---
    await page.route('**/api/bookings/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Reload so the mocked route is active from first fetch
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000); // allow react-query to settle

    // BUG: dashboard silently shows zeros — no error indicator
    // EXPECTED after fix: an error message, alert, or toast is visible

    // Check for any error-related text on the page
    const errorIndicators = [
      page.locator('text=error', { exact: false }),
      page.locator('text=failed', { exact: false }),
      page.locator('text=unavailable', { exact: false }),
      page.locator('text=could not load', { exact: false }),
      page.locator('[role="alert"]'),
      page.locator('.error'),
      page.locator('[data-testid*="error"]'),
    ];

    let errorVisible = false;
    for (const locator of errorIndicators) {
      if (await locator.first().isVisible().catch(() => false)) {
        errorVisible = true;
        const text = await locator.first().textContent().catch(() => '');
        console.log('Error indicator found:', text?.trim());
        break;
      }
    }

    // BUG: this assertion fails because no error UI is rendered
    expect(
      errorVisible,
      'An error indicator must be visible when the stats API fails',
    ).toBe(true);
  });

  test('dashboard must not silently show zeros when stats API fails', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Force stats to 500
    await page.route('**/api/bookings/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Also mock the other bookings endpoints so we can isolate the stats failure
    await page.route('**/api/bookings/upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ bookings: [] }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // With the bug, all stats cards show "0" with no error indication
    // Verify the page does NOT show all-zero stats without any warning
    const zeroValues = await page.locator('text="0"').count();
    const hasErrorMessage = await page.locator('[role="alert"], text=/error|failed|unavailable/i').isVisible().catch(() => false);

    console.log(`Zero values on page: ${zeroValues}, Error message shown: ${hasErrorMessage}`);

    // BUG: hasErrorMessage is false, so the following assertion fails
    // EXPECTED: either an error is shown OR stats are not displaying zeros silently
    expect(
      hasErrorMessage,
      'When stats fail, the dashboard must display an error — not silent zeros',
    ).toBe(true);
  });

  test('useDashboardStats isError flag must propagate to the UI', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Force 500 on stats
    await page.route('**/api/bookings/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stats unavailable' }),
      });
    });

    // Collect any toast notifications
    const toastMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().toLowerCase().includes('failed') || msg.text().toLowerCase().includes('error')) {
        toastMessages.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3_000);

    // Check for toast / notification
    const toast = page.locator('[data-sonner-toast], [data-radix-toast-viewport] li, .toast, [role="status"]');
    const toastVisible = await toast.first().isVisible().catch(() => false);

    // Check for inline error state
    const inlineError = page.locator(
      'text=/stats.*unavailable|failed to load|error loading/i',
    );
    const inlineVisible = await inlineError.isVisible().catch(() => false);

    console.log('Toast visible:', toastVisible, '| Inline error visible:', inlineVisible);
    console.log('Console errors captured:', toastMessages);

    // BUG: neither toast nor inline error appears — silently shows zeros
    // EXPECTED after fix: at least one error indicator is visible
    expect(
      toastVisible || inlineVisible,
      'A toast or inline error must appear when dashboard stats fail to load',
    ).toBe(true);
  });

  test('successful stats load must not show an error', async ({ page }) => {
    // Regression guard: after the fix, a SUCCESSFUL stats load must still work normally

    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Return valid stats
    await page.route('**/api/bookings/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalBookings: 5,
          totalRevenue: 250,
          totalClients: 3,
          averageRating: 4.5,
          totalReviews: 2,
          monthlyGrowth: { bookings: 10, revenue: 15, clients: 5 },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);

    // Should NOT show an error indicator for a successful load
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Should show the dashboard with stats
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5_000 });
  });
});
