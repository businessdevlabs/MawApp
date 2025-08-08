import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Provider Setup Flow - 3 Steps', () => {
  let testProvider = {
    email: `provider-setup-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Provider Setup',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    console.log('Setting up provider setup test...');

    // Register provider user
    const providerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(providerResponse.status()).toBe(201);
    console.log('✅ Provider user created');
  });

  test('should complete full 3-step provider setup flow', async ({ page }) => {
    console.log('=== Testing Complete 3-Step Provider Setup Flow ===');

    // ==================== LOGIN ====================
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to provider dashboard
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    console.log('✅ Provider logged in and redirected to dashboard');

    // ==================== SETUP WELCOME SCREEN ====================
    // Should show welcome setup screen for new provider
    await expect(page.locator('text=Welcome to BookEase')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Let\'s get your provider account set up')).toBeVisible();
    
    // Check that all 3 steps are shown
    await expect(page.locator('text=Complete Business Profile')).toBeVisible();
    await expect(page.locator('text=Set Your Schedule')).toBeVisible();
    await expect(page.locator('text=Add Your Services')).toBeVisible();
    
    // Check progress indicator shows 0/3 complete
    await expect(page.locator('text=0/3 Complete')).toBeVisible();
    console.log('✅ Welcome screen shows all 3 setup steps');

    // ==================== STEP 1: BUSINESS PROFILE ====================
    console.log('\n--- STEP 1: Business Profile Setup ---');
    
    // Click on Step 1 - Complete Business Profile
    await page.locator('text=Complete Business Profile').locator('..').locator('a[href="/provider/profile"]').click();
    
    // Should navigate to profile page
    await page.waitForURL('**/provider/profile', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Click Edit Profile button to enter edit mode
    await page.click('button:has-text("Edit Profile")');
    await page.waitForTimeout(1000);
    
    // Fill in business profile form
    await page.fill('input#businessName', 'Test Setup Business');
    await page.fill('textarea#businessDescription', 'This is a test business for setup flow testing');
    await page.fill('input#businessAddress', '123 Test Street, Test City');
    await page.fill('input#businessPhone', '555-123-4567');
    await page.fill('input#businessEmail', testProvider.email);
    await page.fill('input#website', 'https://testsetupbusiness.com');
    
    // Select category if available
    const categorySelect = page.locator('[data-testid="category-select"], [id="category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
    
    // Save profile
    await page.click('button:has-text("Save Changes")');
    
    // Wait for success message
    await expect(page.locator('text=Profile updated, text=updated successfully')).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 1 completed - Business profile saved');
    
    // Navigate back to dashboard to check progress
    await page.goto(`${FRONTEND_URL}/provider/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should now show 1/3 complete
    await expect(page.locator('text=1/3 Complete')).toBeVisible({ timeout: 5000 });
    console.log('✅ Progress updated to 1/3 complete');

    // ==================== STEP 2: SCHEDULE SETUP ====================
    console.log('\n--- STEP 2: Schedule Setup ---');
    
    // Click on Step 2 - Set Your Schedule
    await page.locator('text=Set Your Schedule').locator('..').locator('a[href="/provider/schedule"]').click();
    
    // Should navigate to schedule page
    await page.waitForURL('**/provider/schedule', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Enable at least one day (Monday)
    const mondayToggle = page.locator('text=Monday').locator('..').locator('[role="switch"]').first();
    if (await mondayToggle.isVisible()) {
      await mondayToggle.click();
      console.log('✅ Monday schedule enabled');
    }
    
    // Enable another day (Wednesday) for more availability
    const wednesdayToggle = page.locator('text=Wednesday').locator('..').locator('[role="switch"]').first();
    if (await wednesdayToggle.isVisible()) {
      await wednesdayToggle.click();
      console.log('✅ Wednesday schedule enabled');
    }
    
    // Set working hours if time inputs are available
    const timeInputs = await page.locator('input[type="time"]').count();
    if (timeInputs > 0) {
      // Set start time for enabled days
      const startTimeInputs = page.locator('input[type="time"]').nth(0);
      await startTimeInputs.fill('09:00');
      
      const endTimeInputs = page.locator('input[type="time"]').nth(1);
      await endTimeInputs.fill('17:00');
    }
    
    // Save schedule
    await page.click('button:has-text("Save Schedule")');
    
    // Wait for success message
    await expect(page.locator('text=Schedule saved')).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2 completed - Schedule saved');
    
    // *** CRITICAL TEST: Should automatically navigate to Step 3 ***
    console.log('🔄 Checking automatic navigation to Step 3...');
    await page.waitForURL('**/provider/services', { timeout: 8000 });
    console.log('✅ AUTOMATIC NAVIGATION WORKING - Redirected to services page (Step 3)');

    // ==================== STEP 3: SERVICES SETUP ====================
    console.log('\n--- STEP 3: Services Setup (Auto-navigated) ---');
    
    // Should now be on services page
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the services page
    await expect(page.locator('text=My Services, text=Service Management')).toBeVisible({ timeout: 5000 });
    
    // Create a new service
    await page.click('button:has-text("Add Service")');
    await page.waitForTimeout(1000);
    
    // Fill in service form
    await page.fill('input[name="name"], #service-name', 'Test Setup Service');
    await page.fill('textarea[name="description"], #service-description', 'A service created during setup flow testing');
    await page.fill('input[name="price"], #service-price', '75');
    await page.fill('input[name="duration"], #service-duration', '90');
    
    // Select service category if available
    const serviceCategorySelect = page.locator('[data-testid="service-category"], select[name="categoryId"]').first();
    if (await serviceCategorySelect.isVisible()) {
      await serviceCategorySelect.click();
      await page.waitForTimeout(500);
      const firstServiceOption = page.locator('[role="option"]').first();
      if (await firstServiceOption.isVisible()) {
        await firstServiceOption.click();
      }
    }
    
    // Save service
    await page.click('button:has-text("Create Service"), button:has-text("Save Service")');
    
    // Wait for success message
    await expect(page.locator('text=Service created, text=Service saved')).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 3 completed - Service created');

    // ==================== VERIFY SETUP COMPLETION ====================
    console.log('\n--- Verifying Setup Completion ---');
    
    // Navigate back to dashboard
    await page.goto(`${FRONTEND_URL}/provider/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Should now show full dashboard (setup complete)
    const isSetupComplete = await page.locator('text=Let\'s get your provider account set up').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isSetupComplete) {
      console.log('✅ Setup completed - Full dashboard is now visible');
      
      // Should see welcome message for completed setup
      await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });
      
      // Should see dashboard stats cards
      await expect(page.locator('text=Total Bookings')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();
      
    } else {
      // If still showing setup screen, check progress
      const progressText = await page.locator('text=Complete').textContent();
      console.log('Current progress:', progressText);
      
      // Should show 3/3 complete or setup completed
      await expect(page.locator('text=3/3 Complete, text=Your provider account is fully set up')).toBeVisible({ timeout: 5000 });
    }
    
    console.log('✅ FULL 3-STEP SETUP FLOW COMPLETED SUCCESSFULLY');
  });

  test('should handle partial setup completion correctly', async ({ page }) => {
    console.log('=== Testing Partial Setup Scenarios ===');
    
    // Create a new provider for partial setup testing
    const partialProvider = {
      email: `partial-setup-${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Partial Setup Provider',
      role: 'provider',
      phone: '4444444444'
    };

    // Register new provider
    const response = await page.request.post(`${BASE_URL}/api/auth/register`, {
      data: partialProvider
    });
    expect(response.status()).toBe(201);

    // Login as new provider
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', partialProvider.email);
    await page.fill('input[type="password"]', partialProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    
    // Complete only Step 1 (Profile)
    await page.locator('text=Complete Business Profile').locator('..').locator('a[href="/provider/profile"]').click();
    await page.waitForURL('**/provider/profile');
    
    await page.click('button:has-text("Edit Profile")');
    await page.fill('input#businessName', 'Partial Setup Test');
    await page.fill('input#businessEmail', partialProvider.email);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Profile updated')).toBeVisible();
    
    // Return to dashboard
    await page.goto(`${FRONTEND_URL}/provider/dashboard`);
    await page.waitForTimeout(2000);
    
    // Should show 1/3 complete
    await expect(page.locator('text=1/3 Complete')).toBeVisible();
    
    // Step 1 should show as completed, Steps 2&3 should show Setup buttons
    await expect(page.locator('text=Complete Business Profile').locator('..').locator('text=Complete')).toBeVisible();
    await expect(page.locator('text=Set Your Schedule').locator('..').locator('button:has-text("Setup")')).toBeVisible();
    await expect(page.locator('text=Add Your Services').locator('..').locator('button:has-text("Setup")')).toBeVisible();
    
    console.log('✅ Partial setup (1/3) working correctly');
  });

  test('should allow completing steps in different order', async ({ page }) => {
    console.log('=== Testing Non-Linear Setup Flow ===');
    
    // Create another provider for non-linear testing
    const nonLinearProvider = {
      email: `nonlinear-${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Non Linear Provider',
      role: 'provider',
      phone: '3333333333'
    };

    const response = await page.request.post(`${BASE_URL}/api/auth/register`, {
      data: nonLinearProvider
    });
    expect(response.status()).toBe(201);

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', nonLinearProvider.email);
    await page.fill('input[type="password"]', nonLinearProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    
    // Start with Step 2 (Schedule) instead of Step 1
    console.log('Starting with Step 2 (Schedule) first...');
    await page.locator('text=Set Your Schedule').locator('..').locator('a[href="/provider/schedule"]').click();
    await page.waitForURL('**/provider/schedule');
    
    // Enable Monday
    const mondayToggle = page.locator('text=Monday').locator('..').locator('[role="switch"]').first();
    await mondayToggle.click();
    
    // Save schedule
    await page.click('button:has-text("Save Schedule")');
    await expect(page.locator('text=Schedule saved')).toBeVisible();
    
    // Since profile is not complete, should NOT navigate to Step 3 automatically
    console.log('Checking that Step 2 does not auto-navigate when Step 1 is incomplete...');
    await page.waitForTimeout(3000); // Wait to see if any navigation happens
    
    // Should still be on schedule page (or dashboard)
    const currentUrl = page.url();
    const autoNavigated = currentUrl.includes('/provider/services');
    expect(autoNavigated).toBe(false);
    console.log('✅ No auto-navigation when Step 1 incomplete - correct behavior');
    
    // Return to dashboard and verify Step 2 is marked complete
    await page.goto(`${FRONTEND_URL}/provider/dashboard`);
    await page.waitForTimeout(2000);
    
    // Should show partial completion but setup still required
    await expect(page.locator('text=Let\'s get your provider account set up')).toBeVisible();
    console.log('✅ Non-linear setup flow working correctly');
  });
});