/**
 * BUG-001: Broken provider navigation links go to /provider/undefined
 * File: src/hooks/useBookings.ts:36-40, src/pages/MyBookings.tsx:217
 *
 * Root cause: useBookings.ts maps the provider object but omits the `id` field.
 * Every provider link in My Bookings resolves to /provider/undefined.
 *
 * Fix: Add `id: booking.providerId?._id` to the provider mapping in useBookings.ts.
 *
 * These tests FAIL before the fix and PASS after.
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

const MOCK_PROVIDER_ID = '507f1f77bcf86cd799439022';

const MOCK_BOOKINGS_RESPONSE = {
  bookings: [
    {
      _id: '507f1f77bcf86cd799439011',
      appointmentDate: '2026-03-15T00:00:00.000Z',
      startTime: '10:00',
      durationMinutes: 60,
      totalAmount: 100,
      status: 'confirmed',
      notes: '',
      serviceId: {
        name: 'Test Haircut',
        description: 'Hair styling service',
        price: 100,
      },
      providerId: {
        _id: MOCK_PROVIDER_ID,
        businessName: 'Test Salon',
        businessAddress: '123 Main St, Test City',
        businessPhone: '555-1234',
      },
    },
  ],
};

test.describe('BUG-001: Provider navigation links in My Bookings', () => {
  const clientUser = {
    email: `bug001-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'BUG001 Client',
    role: 'client',
  };

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: clientUser,
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

  test('provider link href should not be /provider/undefined', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // --- mock bookings API to return a booking with a populated providerId ---
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BOOKINGS_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    // --- navigate to My Bookings ---
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');

    // find any provider link
    const providerLink = page.locator('a[href*="/provider/"]').first();
    await expect(providerLink).toBeVisible({ timeout: 10_000 });

    const href = await providerLink.getAttribute('href');
    console.log('Captured provider link href:', href);

    // BUG: href will be "/provider/undefined" because `id` is missing from the mapping
    // EXPECTED after fix: href is "/provider/507f1f77bcf86cd799439022"
    expect(href, 'Provider link must not end in /provider/undefined').not.toContain(
      '/provider/undefined',
    );
    expect(href, 'Provider link must contain a valid MongoDB ObjectId').toMatch(
      /\/provider\/[a-f0-9]{24}$/,
    );
  });

  test('clicking a provider link should navigate to the correct provider page', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // --- mock bookings API ---
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BOOKINGS_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    // --- navigate to My Bookings ---
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');

    const providerLink = page.locator('a[href*="/provider/"]').first();
    await expect(providerLink).toBeVisible({ timeout: 10_000 });
    await providerLink.click();

    // BUG: navigates to /provider/undefined → NotFound or wrong page
    // EXPECTED after fix: navigates to /provider/507f1f77bcf86cd799439022
    const currentUrl = page.url();
    console.log('URL after clicking provider link:', currentUrl);

    expect(currentUrl, 'URL must not contain /provider/undefined').not.toContain(
      '/provider/undefined',
    );
    expect(currentUrl, 'URL must route to the correct provider ID').toContain(
      `/provider/${MOCK_PROVIDER_ID}`,
    );
  });

  test('provider name displayed in My Bookings should be a valid link', async ({ page }) => {
    // --- login ---
    await page.goto('/login');
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // --- mock ---
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BOOKINGS_RESPONSE),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');

    // The provider name "Test Salon" should be an anchor with a valid href
    const salonLink = page.locator('a', { hasText: 'Test Salon' });
    await expect(salonLink).toBeVisible({ timeout: 10_000 });

    const href = await salonLink.getAttribute('href');
    expect(href).toBe(`/provider/${MOCK_PROVIDER_ID}`);
  });
});
