/**
 * BUG-002: Auth race condition — loading=false before user is set
 * File: src/contexts/AuthContext.tsx:34-58
 *
 * Root cause: setLoading(false) is called in the `finally` block. In React 17
 * (no automatic batching), this can fire as a separate render BEFORE setUser()
 * has been applied, creating a window where loading=false AND user=null.
 *
 * Impact: ProtectedRoute stops showing its spinner (because loading=false) but
 * renders children with user=null. Dashboard immediately shows "Please log in"
 * before auth settles.
 *
 * Fix: Move setLoading(false) into the `try` block, immediately after setUser(),
 * so both state updates are guaranteed to be applied together.
 *
 * These tests FAIL before the fix and PASS after.
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

// Stable heading selector — avoids matching the "Welcome back!" login toast
const DASHBOARD_HEADING = 'h1:has-text("Welcome back")';
// ProtectedRoute spinner is the only element with animate-spin in a full-screen loading overlay
const AUTH_SPINNER = 'div.animate-spin';

test.describe('BUG-002: Auth race condition on page refresh', () => {
  const testUser = {
    email: `bug002-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'BUG002 Client',
    role: 'client',
  };

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: testUser,
    });
    if (res.status() !== 201) {
      console.log('Registration failed or user already exists — continuing.');
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('refreshing the dashboard should not flash "Please log in"', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.locator(DASHBOARD_HEADING)).toBeVisible({ timeout: 5_000 });

    // Slow down verifyToken to widen the race-condition window
    await page.route('**/api/auth/verify', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.continue();
    });

    // Track whether the "Please log in" heading ever appears during reload
    let pleaseLoginFlashDetected = false;

    // Reload — this triggers auth re-initialisation
    const reloadPromise = page.reload({ waitUntil: 'domcontentloaded' });

    // Poll immediately after reload starts
    // BUG: with the race condition, "Please log in" appears briefly before user is set
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(100);
      const visible = await page.locator('h1:has-text("Please log in")').isVisible();
      if (visible) {
        pleaseLoginFlashDetected = true;
        console.log(`"Please log in" flash detected at poll ${i + 1}`);
        break;
      }
    }

    await reloadPromise;
    await page.waitForLoadState('networkidle');

    // After reload settles the user must still be on the dashboard
    await expect(page.locator(DASHBOARD_HEADING)).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/login');

    // BUG: this assertion fails when the race condition exists
    expect(
      pleaseLoginFlashDetected,
      '"Please log in" must never flash while a valid token is present',
    ).toBe(false);
  });

  test('ProtectedRoute should show auth spinner — not "Please log in" — during auth init', async ({
    page,
  }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Add significant delay to verifyToken so the loading window is wide enough to observe
    await page.route('**/api/auth/verify', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
      await route.continue();
    });

    // Reload — auth starts with loading=true, user=null
    await page.reload({ waitUntil: 'domcontentloaded' });

    // During the loading window, ProtectedRoute must show its spinner
    // NOT Dashboard's "Please log in" fallback

    // BUG: if loading=false fires before user is set, ProtectedRoute skips its spinner
    // and renders Dashboard child immediately with user=null → shows "Please log in"
    const pleaseLoginVisible = await page.locator('h1:has-text("Please log in")').isVisible();
    expect(
      pleaseLoginVisible,
      'During auth init, "Please log in" must NOT appear — spinner should be shown instead',
    ).toBe(false);

    // Spinner (from ProtectedRoute) should be visible while verifyToken is pending
    await expect(page.locator(AUTH_SPINNER)).toBeVisible({ timeout: 2_000 });

    // Eventually the real dashboard content should appear
    await page.waitForLoadState('networkidle');
    await expect(page.locator(DASHBOARD_HEADING)).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated user must remain on dashboard after page refresh', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.locator(DASHBOARD_HEADING)).toBeVisible({ timeout: 5_000 });

    // Hard refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Must stay on /dashboard — never redirected to /login
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/login');

    // "Welcome back" heading must appear — "Please log in" heading must not
    await expect(page.locator(DASHBOARD_HEADING)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1:has-text("Please log in")')).not.toBeVisible();
  });
});
