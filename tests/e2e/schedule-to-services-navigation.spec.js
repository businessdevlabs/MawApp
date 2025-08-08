import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Schedule to Services Navigation', () => {
  let testProvider = {
    email: `nav-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Navigation Test Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Navigation test provider created');
  });

  test('should navigate from schedule save to services when provider is in setup mode', async ({ page }) => {
    console.log('=== Testing Schedule → Services Navigation ===');

    // Step 1: Login as provider
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    console.log('✅ Provider logged in');

    // Step 2: Complete business profile first (required for navigation logic)
    console.log('\n--- Setting up business profile ---');
    await page.goto(`${FRONTEND_URL}/provider/profile`);
    await page.waitForLoadState('networkidle');
    
    // Edit profile
    await page.click('button:has-text("Edit Profile")');
    await page.waitForTimeout(1000);
    
    // Fill minimum required fields
    await page.fill('input#businessName', 'Navigation Test Business');
    await page.fill('input#businessEmail', testProvider.email);
    
    // Save profile
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 });
    console.log('✅ Business profile completed');

    // Step 3: Go to schedule page
    console.log('\n--- Testing schedule page ---');
    await page.goto(`${FRONTEND_URL}/provider/schedule`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Current URL before schedule setup:', page.url());

    // Step 4: Set up schedule (enable at least one day)
    console.log('Setting up schedule...');
    
    // Try different selectors for Monday toggle
    let mondayToggled = false;
    
    // Try approach 1: Find switch by Monday text
    const mondaySection = page.locator('text=Monday').first();
    if (await mondaySection.isVisible()) {
      const switchElement = mondaySection.locator('..').locator('[role="switch"]').first();
      if (await switchElement.isVisible()) {
        await switchElement.click();
        mondayToggled = true;
        console.log('✅ Monday schedule enabled (approach 1)');
      }
    }
    
    // Try approach 2: Find any available switch
    if (!mondayToggled) {
      const switches = await page.locator('[role="switch"]').all();
      if (switches.length > 0) {
        await switches[0].click();
        mondayToggled = true;
        console.log('✅ Schedule enabled (approach 2)');
      }
    }
    
    // Try approach 3: Look for checkbox inputs
    if (!mondayToggled) {
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      if (checkboxes.length > 0) {
        await checkboxes[0].click();
        mondayToggled = true;
        console.log('✅ Schedule enabled (approach 3)');
      }
    }

    if (!mondayToggled) {
      console.log('❌ Could not enable schedule, continuing anyway...');
    }

    // Step 5: Save schedule
    console.log('Saving schedule...');
    const saveButton = page.locator('button:has-text("Save Schedule")');
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    
    // Wait for success message
    await expect(page.locator('text=Schedule saved')).toBeVisible({ timeout: 5000 });
    console.log('✅ Schedule saved successfully');

    // Step 6: Check for automatic navigation to services
    console.log('\n--- Checking automatic navigation ---');
    console.log('Waiting for navigation to services page...');
    
    try {
      // Wait for navigation with a longer timeout
      await page.waitForURL('**/provider/services', { timeout: 8000 });
      console.log('✅ SUCCESS: Automatically navigated to services page!');
      
      // Verify we're on services page
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).toContain('/provider/services');
      
      // Look for services page content
      await expect(page.locator('text=My Services, text=Service Management, text=Add Service')).toBeVisible({ timeout: 5000 });
      console.log('✅ Services page loaded correctly');
      
    } catch (error) {
      console.log('❌ No automatic navigation occurred');
      console.log('Current URL:', page.url());
      
      // Check if still on schedule page
      if (page.url().includes('/provider/schedule')) {
        console.log('Still on schedule page - navigation fix may not be working');
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/schedule-no-navigation.png' });
      console.log('📸 Screenshot saved for debugging');
      
      throw new Error('Expected automatic navigation to services page did not occur');
    }

    console.log('✅ NAVIGATION TEST COMPLETED SUCCESSFULLY');
  });

  test('should not navigate when services already exist', async ({ page }) => {
    console.log('=== Testing No Navigation When Services Exist ===');

    // Create a provider with services
    const providerWithServices = {
      email: `services-exist-${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Provider With Services',
      role: 'provider',
      phone: '4444444444'
    };

    // Register provider
    const response = await page.request.post(`${BASE_URL}/api/auth/register`, {
      data: providerWithServices
    });
    expect(response.status()).toBe(201);

    // Login as provider
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', providerWithServices.email);
    await page.fill('input[type="password"]', providerWithServices.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');

    // Create a service first
    await page.goto(`${FRONTEND_URL}/provider/services`);
    await page.waitForLoadState('networkidle');
    
    // Add a service (simplified)
    const addServiceButton = page.locator('button:has-text("Add Service")');
    if (await addServiceButton.isVisible()) {
      await addServiceButton.click();
      await page.waitForTimeout(1000);
      
      // Fill basic service info
      await page.fill('input[name="name"]', 'Existing Service');
      await page.fill('input[name="price"]', '50');
      await page.fill('input[name="duration"]', '60');
      
      // Save service
      await page.click('button:has-text("Create Service")');
      await page.waitForTimeout(2000);
    }

    // Now go to schedule page
    await page.goto(`${FRONTEND_URL}/provider/schedule`);
    await page.waitForLoadState('networkidle');
    
    // Enable a schedule day
    const switches = await page.locator('[role="switch"]').all();
    if (switches.length > 0) {
      await switches[0].click();
    }
    
    // Save schedule
    await page.click('button:has-text("Save Schedule")');
    await expect(page.locator('text=Schedule saved')).toBeVisible();
    
    // Should NOT navigate since services already exist
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const navigatedToServices = currentUrl.includes('/provider/services');
    
    expect(navigatedToServices).toBe(false);
    console.log('✅ Correctly did not navigate when services already exist');
  });
});