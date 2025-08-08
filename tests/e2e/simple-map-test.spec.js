import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Simple Map Test', () => {
  let testProvider = {
    email: `simple-map-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Simple Map Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Simple map test provider created');
  });

  test('should show map component in provider profile', async ({ page }) => {
    console.log('=== Simple Map Visibility Test ===');

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    console.log('✅ Provider logged in');

    // Navigate to profile page
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());
    
    // Should have map component visible
    const hasMap = await page.locator('[data-testid="provider-map"]').isVisible().catch(() => false);
    expect(hasMap).toBe(true);
    console.log('✅ Map component is present');

    // Should have address input field
    await expect(page.locator('input#businessAddress')).toBeVisible();
    console.log('✅ Business address input field is visible');

    // Should have both address input and map visible at the same time
    const addressVisible = await page.locator('input#businessAddress').isVisible();
    const mapVisible = await page.locator('[data-testid="provider-map"]').isVisible();
    
    expect(addressVisible).toBe(true);
    expect(mapVisible).toBe(true);
    console.log('✅ Both address field and map are visible simultaneously');

    // Fill address field
    await page.fill('input#businessAddress', '123 Test Street');
    await expect(page.locator('input#businessAddress')).toHaveValue('123 Test Street');
    console.log('✅ Address field can be filled and retains value');

    // Map should still be visible after filling address field
    await expect(page.locator('[data-testid="provider-map"]')).toBeVisible();
    console.log('✅ Map remains visible after address field interaction');

    console.log('✅ SIMPLE MAP TEST PASSED');
  });
});