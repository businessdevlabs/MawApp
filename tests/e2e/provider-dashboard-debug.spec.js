import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Provider Dashboard Debug', () => {
  let testProvider = {
    email: `debug-provider-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Debug Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Debug provider created');
  });

  test('should debug provider dashboard content', async ({ page }) => {
    console.log('=== Debugging Provider Dashboard ===');

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/provider/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // Debug what's actually on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for welcome text variations
    const welcomeTexts = [
      'Welcome to BookEase',
      'Welcome back',
      'Let\'s get your provider account set up',
      'provider account set up',
      'Setup Required'
    ];
    
    for (const text of welcomeTexts) {
      const isVisible = await page.locator(`text=${text}`).isVisible().catch(() => false);
      console.log(`"${text}": ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }
    
    // Check for setup steps
    const setupSteps = [
      'Complete Business Profile',
      'Set Your Schedule', 
      'Add Your Services'
    ];
    
    console.log('\n--- Setup Steps Visibility ---');
    for (const step of setupSteps) {
      const isVisible = await page.locator(`text=${step}`).isVisible().catch(() => false);
      console.log(`"${step}": ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }
    
    // Check for progress indicators
    const progressIndicators = [
      '0/3 Complete',
      '1/3 Complete', 
      '2/3 Complete',
      '3/3 Complete',
      'Setup Required'
    ];
    
    console.log('\n--- Progress Indicators ---');
    for (const indicator of progressIndicators) {
      const isVisible = await page.locator(`text=${indicator}`).isVisible().catch(() => false);
      console.log(`"${indicator}": ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }
    
    // Check what buttons are available
    console.log('\n--- Available Buttons ---');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const buttonText = await buttons[i].textContent().catch(() => '[ERROR]');
      const isVisible = await buttons[i].isVisible().catch(() => false);
      console.log(`Button ${i}: "${buttonText}" ${isVisible ? '(visible)' : '(hidden)'}`);
    }
    
    // Check for any dashboard stats (if setup is complete)
    console.log('\n--- Dashboard Stats ---');
    const dashboardStats = [
      'Total Bookings',
      'Revenue',
      'Clients',
      'Average Rating'
    ];
    
    for (const stat of dashboardStats) {
      const isVisible = await page.locator(`text=${stat}`).isVisible().catch(() => false);
      console.log(`"${stat}": ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }
    
    // Get page content for debugging
    console.log('\n--- Page Content Sample ---');
    const bodyText = await page.locator('body').textContent();
    const contentPreview = bodyText?.substring(0, 500) + '...';
    console.log('Body content preview:', contentPreview);
    
    // Take screenshot for visual debugging
    await page.screenshot({ path: 'test-results/provider-dashboard-debug.png' });
    console.log('📸 Screenshot saved to test-results/provider-dashboard-debug.png');
    
    console.log('\n=== Debug Complete ===');
  });
});