import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Final Provider Setup Flow Test', () => {
  let testProvider = {
    email: `final-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Final Test Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Final test provider created');
  });

  test('should complete 3-step provider setup with automatic navigation', async ({ page }) => {
    console.log('=== Final 3-Step Provider Setup Test ===');

    // Step 0: Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    console.log('✅ Provider logged in');

    // Should see welcome setup screen
    await expect(page.locator('text=Welcome to BookEase')).toBeVisible();
    await expect(page.locator('text=0/3 Complete')).toBeVisible();
    console.log('✅ Welcome setup screen shown');

    // STEP 1: Complete Business Profile
    console.log('\n--- STEP 1: Business Profile ---');
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Edit Profile")');
    await page.fill('input#businessName', 'Final Test Business');
    await page.fill('input#businessEmail', testProvider.email);
    await page.fill('textarea#businessDescription', 'A business for final testing');
    
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Profile updated').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 1 completed - Business profile saved');

    // STEP 2: Set Schedule (should auto-navigate to Step 3)
    console.log('\n--- STEP 2: Schedule Setup ---');
    await page.goto(`${FRONTEND_URL}/provider/schedule`);
    await page.waitForLoadState('networkidle');
    
    // Enable Monday
    const mondaySwitch = page.locator('text=Monday').locator('..').locator('[role="switch"]').first();
    await mondaySwitch.click();
    console.log('✅ Monday schedule enabled');
    
    // Save schedule
    await page.click('button:has-text("Save Schedule")');
    await expect(page.locator('text=Schedule saved').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2 completed - Schedule saved');
    
    // *** CRITICAL: Should automatically navigate to services ***
    console.log('🔄 Checking automatic navigation...');
    await page.waitForURL('**/provider/services', { timeout: 8000 });
    console.log('✅ AUTOMATIC NAVIGATION SUCCESS - Now on services page!');

    // STEP 3: Add Service (already on services page)
    console.log('\n--- STEP 3: Add Service ---');
    await page.waitForLoadState('networkidle');
    
    // Create service
    await page.click('button:has-text("Add Service")');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="name"]', 'Final Test Service');
    await page.fill('textarea[name="description"]', 'Service created in final test');
    await page.fill('input[name="price"]', '100');
    await page.fill('input[name="duration"]', '60');
    
    // Save service
    await page.click('button:has-text("Create Service")');
    await expect(page.locator('text=Service created, text=Service saved').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 3 completed - Service created');

    // FINAL: Verify complete setup
    console.log('\n--- VERIFICATION: Setup Complete ---');
    await page.goto(`${FRONTEND_URL}/provider/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Should no longer show setup screen - should show full dashboard
    const showingSetupScreen = await page.locator('text=Let\'s get your provider account set up').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!showingSetupScreen) {
      console.log('✅ SETUP COMPLETE - Full provider dashboard is now visible');
      await expect(page.locator('text=Welcome back')).toBeVisible();
      await expect(page.locator('text=Total Bookings')).toBeVisible();
    } else {
      // Check if showing completed setup
      await expect(page.locator('text=3/3 Complete, text=fully set up')).toBeVisible();
      console.log('✅ SETUP COMPLETE - Showing 3/3 complete');
    }

    console.log('✅ ALL 3 STEPS COMPLETED SUCCESSFULLY WITH AUTOMATIC NAVIGATION!');
  });

  test('should handle setup completion status correctly', async ({ page }) => {
    console.log('=== Verifying Setup Completion Status ===');
    
    // Login as the provider who just completed setup
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    
    await page.waitForTimeout(3000);
    
    // Provider should now see completed dashboard
    const isSetupComplete = !await page.locator('text=Let\'s get your provider account set up').isVisible({ timeout: 2000 }).catch(() => true);
    
    if (isSetupComplete) {
      console.log('✅ Provider sees full dashboard (setup complete)');
      await expect(page.locator('text=Welcome back')).toBeVisible();
    } else {
      console.log('✅ Provider still sees setup screen with completion status');
      await expect(page.locator('text=3/3 Complete')).toBeVisible();
    }
    
    console.log('✅ Setup completion status working correctly');
  });
});