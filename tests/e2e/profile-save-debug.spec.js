import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Profile Save Debug', () => {
  let testProvider = {
    email: `save-debug-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Save Debug Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Save debug test provider created');
  });

  test('should debug profile save API call', async ({ page }) => {
    console.log('=== Debugging Profile Save ===');

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/provider/profile')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/provider/profile')) {
        console.log(`API Response: ${response.status()} ${response.statusText()}`);
      }
    });

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    console.log('✅ Provider logged in');

    // Navigate to profile
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill required fields
    await page.fill('input#businessName', 'Debug Test Business');
    await page.fill('input#businessEmail', testProvider.email);
    await page.fill('input#website', 'https://debug.com');

    // Select category if available
    const categorySelect = page.locator('[role="combobox"]').first();
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
        console.log('✅ Category selected');
      }
    }

    console.log('About to click Save Changes button...');
    
    // Click save and wait for potential API call
    await page.click('button:has-text("Save Changes")');
    
    // Wait and see what happens
    await page.waitForTimeout(3000);
    
    // Check console logs
    console.log('\\n--- Console Logs ---');
    consoleLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });

    // Check network requests
    console.log('\\n--- Network Requests ---');
    networkRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Data: ${req.postData}`);
      }
    });

    console.log('\\n--- End Debug Info ---');
    
    // Check if success message appears or if there are validation errors
    const successMessage = await page.locator('text=Profile updated').isVisible().catch(() => false);
    const hasValidationErrors = await page.locator('.text-red-500').count();
    
    console.log(`Success message visible: ${successMessage}`);
    console.log(`Validation errors count: ${hasValidationErrors}`);
    
    if (hasValidationErrors > 0) {
      console.log('Validation errors found:');
      const errors = await page.locator('.text-red-500').allTextContents();
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    console.log('✅ Debug test completed');
  });
});