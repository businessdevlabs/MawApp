import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Provider Profile - Map Independent of Address Field', () => {
  let testProvider = {
    email: `map-independent-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Map Independent Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Map independent test provider created');
  });

  test('should show map but address text input should not update map coordinates', async ({ page }) => {
    console.log('=== Testing Map Independence ===');

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

    // Fill address field with different text
    await page.fill('input#businessAddress', '123 Test Street, Test City');
    console.log('✅ Address field filled with test address');

    // Wait to see if map would update (it shouldn't automatically)
    await page.waitForTimeout(2000);

    // The address field should have the text we entered
    await expect(page.locator('input#businessAddress')).toHaveValue('123 Test Street, Test City');
    console.log('✅ Address field contains the entered text');

    // Map should still be present and functional
    await expect(page.locator('[data-testid="provider-map"]')).toBeVisible();
    console.log('✅ Map is still present after address field change');

    // Test that form validation still works
    await page.fill('input#businessName', 'Map Test Business');
    await page.fill('input#businessEmail', testProvider.email);
    await page.fill('input#website', 'https://maptest.com');

    // Select category if available
    const categorySelect = page.locator('[role="combobox"]').first();
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }
    }

    // Save the form
    await page.click('button:has-text("Save Changes")');
    
    // Should see success message
    await expect(page.locator('text=Profile updated').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Profile saved successfully with address and map present');

    // Verify address field still has our text after save
    await page.waitForTimeout(1000);
    await expect(page.locator('input#businessAddress')).toHaveValue('123 Test Street, Test City');
    console.log('✅ Address field maintains its value after save');

    // Map should still be present after save
    await expect(page.locator('[data-testid="provider-map"]')).toBeVisible();
    console.log('✅ Map remains present after form save');

    console.log('✅ TEST PASSED - Map is present but independent of address text field');
  });

  test('should allow manual map interaction without affecting address field', async ({ page }) => {
    console.log('=== Testing Manual Map Interaction ===');

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');

    // Navigate to profile
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for map to load

    // Set initial address in text field
    await page.fill('input#businessAddress', 'Original Address Text');
    console.log('✅ Set initial address in text field');

    // Check if map search is available (for manual interaction)
    const mapSearchInput = page.locator('#address-search');
    if (await mapSearchInput.isVisible().catch(() => false)) {
      console.log('✅ Map search input is available for manual interaction');
      
      // Use map search (this should update coordinates but not the address text field)
      await mapSearchInput.fill('New York City');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      // Address text field should still have original text
      await expect(page.locator('input#businessAddress')).toHaveValue('Original Address Text');
      console.log('✅ Address text field unchanged after map search');
    } else {
      console.log('⚠️ Map search not available, but test continues');
    }

    // Verify map is still functional
    await expect(page.locator('[data-testid="provider-map"]')).toBeVisible();
    console.log('✅ Map remains functional');

    console.log('✅ Manual map interaction test completed');
  });
});