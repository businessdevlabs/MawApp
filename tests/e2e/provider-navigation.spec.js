import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Provider Navigation Behavior', () => {
  let providerUser = {
    email: `provider-nav-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Provider Navigation',
    role: 'provider',
    phone: '5555555555'
  };

  let clientUser = {
    email: `client-nav-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Client Navigation',
    role: 'client',
    phone: '4444444444'
  };

  test.beforeAll(async ({ request }) => {
    console.log('Setting up navigation tests...');

    // Register provider user
    const providerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: providerUser
    });
    expect(providerResponse.status()).toBe(201);
    console.log('Provider user created');

    // Register client user
    const clientResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: clientUser
    });
    expect(clientResponse.status()).toBe(201);
    console.log('Client user created');
  });

  test('provider login should redirect to dashboard', async ({ page }) => {
    console.log('Testing provider login redirect...');

    // Go to login page
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[type="email"]', providerUser.email);
    await page.fill('input[type="password"]', providerUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    
    // Verify we're on the provider dashboard
    expect(page.url()).toContain('/provider/dashboard');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Provider successfully redirected to dashboard after login');
  });

  test('provider cannot access home page - gets redirected to dashboard', async ({ page }) => {
    console.log('Testing provider home page protection...');

    // Login as provider first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', providerUser.email);
    await page.fill('input[type="password"]', providerUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for initial redirect to dashboard
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    
    // Now try to navigate to home page
    console.log('Attempting to navigate to home page...');
    await page.goto(`${FRONTEND_URL}/`);
    
    // Should be redirected back to provider dashboard
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/provider/dashboard');
    
    console.log('✅ Provider correctly redirected from home page to dashboard');
  });

  test('provider logo click navigates to dashboard', async ({ page }) => {
    console.log('Testing provider logo navigation...');

    // Login as provider
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', providerUser.email);
    await page.fill('input[type="password"]', providerUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    
    // Navigate to a different provider page
    await page.goto(`${FRONTEND_URL}/provider/services`);
    await page.waitForLoadState('networkidle');
    
    // Click the logo
    const logo = page.locator('a[href="/provider/dashboard"]').first();
    await expect(logo).toBeVisible();
    await logo.click();
    
    // Should navigate to provider dashboard
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/provider/dashboard');
    
    console.log('✅ Provider logo correctly navigates to dashboard');
  });

  test('client login should redirect to regular dashboard', async ({ page }) => {
    console.log('Testing client login redirect...');

    // Go to login page
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect - clients should go to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're on the regular dashboard (not provider dashboard)
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/provider');
    
    console.log('✅ Client correctly redirected to regular dashboard');
  });

  test('client can access home page normally', async ({ page }) => {
    console.log('Testing client home page access...');

    // Login as client first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for initial redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Now navigate to home page
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Should stay on home page
    expect(page.url()).toBe(`${FRONTEND_URL}/`);
    
    // Verify home page content is visible
    await expect(page.locator('text=Book your next appointment')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Client can access home page normally');
  });

  test('client logo click navigates to home page', async ({ page }) => {
    console.log('Testing client logo navigation...');

    // Login as client
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', clientUser.email);
    await page.fill('input[type="password"]', clientUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to services page
    await page.goto(`${FRONTEND_URL}/services`);
    await page.waitForLoadState('networkidle');
    
    // Click the logo (for clients, it should link to home page)
    const logo = page.locator('a[href="/"]').first();
    await expect(logo).toBeVisible();
    await logo.click();
    
    // Should navigate to home page
    await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
    expect(page.url()).toBe(`${FRONTEND_URL}/`);
    
    // Verify home page content
    await expect(page.locator('text=Book your next appointment')).toBeVisible();
    
    console.log('✅ Client logo correctly navigates to home page');
  });

  test('unauthenticated users can access home page', async ({ page }) => {
    console.log('Testing unauthenticated home page access...');

    // Navigate to home page without logging in
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Should stay on home page
    expect(page.url()).toBe(`${FRONTEND_URL}/`);
    
    // Verify home page content is visible
    await expect(page.locator('text=Book your next appointment')).toBeVisible();
    
    // Verify header sign up/login buttons are present  
    await expect(page.locator('header a[href="/register"]')).toBeVisible();
    await expect(page.locator('header a[href="/login"]')).toBeVisible();
    
    console.log('✅ Unauthenticated users can access home page normally');
  });
});