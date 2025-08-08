import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Provider Profile Always Editable', () => {
  let testProvider = {
    email: `editable-profile-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Editable Profile Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Editable profile test provider created');
  });

  test('should always show editable form without edit/cancel buttons', async ({ page }) => {
    console.log('=== Testing Always Editable Profile ===');

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
    
    // Should NOT have Edit Profile button (form is always editable)
    const hasEditButton = await page.locator('button:has-text("Edit Profile")').isVisible().catch(() => false);
    expect(hasEditButton).toBe(false);
    console.log('✅ No "Edit Profile" button found (form always editable)');

    // Should NOT have Cancel button
    const hasCancelButton = await page.locator('button:has-text("Cancel")').isVisible().catch(() => false);
    expect(hasCancelButton).toBe(false);
    console.log('✅ No "Cancel" button found');

    // Should have form inputs visible and editable
    await expect(page.locator('input#businessName')).toBeVisible();
    await expect(page.locator('textarea#businessDescription')).toBeVisible();
    await expect(page.locator('input#businessAddress')).toBeVisible();
    await expect(page.locator('input#businessPhone')).toBeVisible();
    await expect(page.locator('input#businessEmail')).toBeVisible();
    console.log('✅ All form inputs are visible and accessible');

    // Should have Save Changes button
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    console.log('✅ Save Changes button is visible');

    // Test that business address is a simple text field (no map integration)
    const businessAddressInput = page.locator('input#businessAddress');
    await businessAddressInput.fill('123 Test Street, Test City');
    
    // Should NOT have map component visible
    const hasMap = await page.locator('[data-testid="provider-map"]').isVisible().catch(() => false);
    expect(hasMap).toBe(false);
    console.log('✅ No map component found - address is simple text field');

    // Test filling out and saving the form
    await page.fill('input#businessName', 'Always Editable Test Business');
    await page.fill('textarea#businessDescription', 'A business that tests the always-editable profile form');
    await page.fill('input#businessPhone', '555-123-4567');
    await page.fill('input#businessEmail', testProvider.email);
    await page.fill('input#website', 'https://alwayseditable.com');

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
    console.log('✅ Profile saved successfully');

    // Form should still be editable after save (no switch to read-only mode)
    await page.waitForTimeout(2000);
    await expect(page.locator('input#businessName')).toBeVisible();
    await expect(page.locator('input#businessName')).toHaveValue('Always Editable Test Business');
    console.log('✅ Form remains editable after save');

    console.log('✅ ALL TESTS PASSED - Profile is always editable with no map integration');
  });

  test('should handle form validation correctly', async ({ page }) => {
    console.log('=== Testing Form Validation ===');

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');

    // Navigate to profile
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');

    // Clear required fields to test validation
    await page.fill('input#businessName', '');
    await page.fill('input#businessEmail', '');
    await page.fill('input#website', '');

    // Try to save
    await page.click('button:has-text("Save Changes")');

    // Should show validation errors
    await expect(page.locator('text=Business name must be at least')).toBeVisible({ timeout: 3000 });
    console.log('✅ Validation errors shown for required fields');

    // Fill valid data
    await page.fill('input#businessName', 'Valid Business');
    await page.fill('input#businessEmail', 'valid@email.com');
    await page.fill('input#website', 'https://valid.com');

    // Should be able to save now
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Profile updated').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Form validation working correctly');
  });
});