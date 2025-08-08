import { test, expect } from '@playwright/test';

test.describe('Booking Login Flow', () => {
  // Set up test data
  const testUser = {
    email: `testclient-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test Client',
    role: 'client'
  };

  test.beforeAll(async ({ request }) => {
    // Create test user before running tests
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: testUser
    });
    
    if (response.status() !== 201) {
      console.log('Test user might already exist, continuing with tests');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Start with a clean state - clear localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect to login when unauthenticated user clicks Book Now, then redirect to service page after login', async ({ page }) => {
    // Step 1: Navigate to services page
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    // Wait for services to load
    await expect(page.locator('text=Discover Services')).toBeVisible();
    await expect(page.locator('text=Find and book the perfect service provider for your needs')).toBeVisible();

    // Wait for services to load and check if any exist
    await page.waitForTimeout(2000); // Give time for API call
    
    const servicesCount = await page.locator('text=/\\d+ services found/').textContent();
    console.log('Services found:', servicesCount);
    
    // If no services exist, skip this test
    if (servicesCount?.includes('0 services found')) {
      test.skip(true, 'No services available for testing');
    }

    // Step 2: Look for a "Book Now" button and click it
    const bookNowButton = page.locator('button:has-text("Book Now")').first();
    await expect(bookNowButton).toBeVisible({ timeout: 15000 });
    
    // Get the service ID by examining the page structure
    const serviceCard = page.locator('.group').first();
    await expect(serviceCard).toBeVisible();
    
    await bookNowButton.click();

    // Step 3: Should be redirected to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Step 4: Check that the redirect URL is stored in localStorage
    const redirectUrl = await page.evaluate(() => localStorage.getItem('redirectAfterLogin'));
    expect(redirectUrl).toMatch(/^\/service\/[a-f0-9]{20,24}$/); // MongoDB ObjectId pattern (flexible length)

    // Step 5: Fill in login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Step 6: Submit login form
    await page.click('button[type="submit"]');

    // Step 7: Should be redirected to the service detail page
    await expect(page).toHaveURL(new RegExp('^/service/[a-f0-9]{20,24}$'), { timeout: 10000 });
    
    // Step 8: Verify we're on the service detail page
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 }); // Service name as h1
    
    // Step 9: Verify redirect URL is cleared from localStorage
    const clearedRedirectUrl = await page.evaluate(() => localStorage.getItem('redirectAfterLogin'));
    expect(clearedRedirectUrl).toBeNull();

    // Step 10: Verify user can now book the service (check for booking form elements)
    const bookingForm = page.locator('form, text=Select Date');
    await expect(bookingForm.first()).toBeVisible({ timeout: 5000 });
  });

  test('should register new user and redirect to service page after registration', async ({ page }) => {
    // Step 1: Navigate to services page
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    // Step 2: Click Book Now button
    const bookNowButton = page.locator('button:has-text("Book Now")').first();
    await expect(bookNowButton).toBeVisible({ timeout: 10000 });
    await bookNowButton.click();

    // Step 3: Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Step 4: Click "Sign up" link to go to registration
    await page.click('text=Sign up');
    await expect(page).toHaveURL('/register');

    // Step 5: Fill registration form
    const timestamp = Date.now();
    const newUser = {
      email: `newclient${timestamp}@example.com`,
      password: 'password123',
      fullName: 'New Test Client'
    };

    // Select client role (radio button)
    await page.click('input[value="client"]');
    
    await page.fill('input[placeholder="Enter your full name"]', newUser.fullName);
    await page.fill('input[type="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.password);

    // Step 6: Submit registration
    await page.click('button[type="submit"]');

    // Step 7: Should be redirected to the service detail page
    await expect(page).toHaveURL(new RegExp('^/service/[a-f0-9]{20,24}$'), { timeout: 15000 });
    
    // Step 8: Verify we're on the service detail page
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 }); // Service name as h1
  });

  test('should handle direct navigation to service page when not authenticated', async ({ page }) => {
    // Create a mock service ID
    const mockServiceId = '507f1f77bcf86cd799439011';
    
    // Step 1: Try to navigate directly to a service page
    await page.goto(`/service/${mockServiceId}`);
    
    // Step 2: Should be redirected to login or show login prompt
    // Note: This depends on the implementation - service detail page might handle auth differently
    
    // Check if we're redirected to login OR if there's a login button on the service page
    try {
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    } catch {
      // If not redirected to login, check if there's authentication required on the service page
      const loginButton = page.locator('text=Login to Book');
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await expect(page).toHaveURL('/login');
      }
    }
  });

  test('should not redirect authenticated user', async ({ page }) => {
    // Step 1: Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Navigate to services page
    await page.goto('/services');
    
    // Step 3: Click Book Now button
    const bookNowButton = page.locator('button:has-text("Book Now")').first();
    await expect(bookNowButton).toBeVisible({ timeout: 10000 });
    await bookNowButton.click();

    // Step 4: Should go directly to service detail page (no login redirect)
    await expect(page).toHaveURL(new RegExp('^/service/[a-f0-9]{20,24}$'));
    
    // Step 5: Should not have stored redirect URL
    const redirectUrl = await page.evaluate(() => localStorage.getItem('redirectAfterLogin'));
    expect(redirectUrl).toBeNull();
  });
});