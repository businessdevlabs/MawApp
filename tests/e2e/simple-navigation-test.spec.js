import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Simple Navigation Test', () => {
  let testProvider = {
    email: `simple-nav-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Simple Nav Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Simple navigation test provider created');
  });

  test('should test schedule save and check for navigation', async ({ page }) => {
    console.log('=== Simple Navigation Test ===');

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Login
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/provider/dashboard');
    console.log('✅ Provider logged in');

    // Go directly to schedule page
    console.log('Navigating to schedule page...');
    await page.goto(`${FRONTEND_URL}/provider/schedule`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Debug what's on the schedule page
    const hasScheduleTitle = await page.locator('text=Schedule, text=Working Hours, text=Availability').isVisible().catch(() => false);
    console.log('Has schedule content:', hasScheduleTitle);
    
    // Look for save button
    const saveButton = page.locator('button:has-text("Save Schedule"), button:has-text("Save"), button:has-text("Update Schedule")');
    const saveButtonVisible = await saveButton.isVisible().catch(() => false);
    console.log('Save button visible:', saveButtonVisible);
    
    if (saveButtonVisible) {
      console.log('Clicking save button...');
      await saveButton.click();
      
      // Wait a bit to see what happens
      await page.waitForTimeout(3000);
      
      console.log('URL after save:', page.url());
      
      // Check if we navigated
      if (page.url().includes('/provider/services')) {
        console.log('✅ SUCCESS: Navigated to services page!');
      } else {
        console.log('❌ No navigation occurred');
        
        // Check for success message
        const hasSuccessMessage = await page.locator('text=saved, text=updated, text=success').isVisible().catch(() => false);
        console.log('Has success message:', hasSuccessMessage);
        
        // Look for any toast notifications
        const toastMessages = await page.locator('[role="status"], .toast, [data-state="open"]').all();
        console.log('Toast messages found:', toastMessages.length);
        
        for (let i = 0; i < toastMessages.length; i++) {
          const text = await toastMessages[i].textContent().catch(() => '');
          console.log(`Toast ${i}:`, text);
        }
      }
    } else {
      // Try to enable at least one day first
      console.log('Looking for schedule controls...');
      
      // Look for any switches or toggles
      const switches = await page.locator('[role="switch"], input[type="checkbox"], .switch').all();
      console.log('Found switches/toggles:', switches.length);
      
      if (switches.length > 0) {
        console.log('Enabling first schedule option...');
        await switches[0].click();
        await page.waitForTimeout(1000);
        
        // Now try to save
        const saveButtonAfter = page.locator('button:has-text("Save Schedule"), button:has-text("Save"), button:has-text("Update")');
        if (await saveButtonAfter.isVisible()) {
          console.log('Clicking save after enabling schedule...');
          await saveButtonAfter.click();
          
          await page.waitForTimeout(3000);
          console.log('Final URL:', page.url());
          
          if (page.url().includes('/provider/services')) {
            console.log('✅ SUCCESS: Navigation worked after enabling schedule!');
          } else {
            console.log('❌ Still no navigation');
          }
        }
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/simple-navigation-test.png' });
    console.log('📸 Screenshot saved');
    
    // Print console logs for debugging
    console.log('\n--- Browser Console Logs ---');
    consoleLogs.forEach((log, i) => {
      if (log.includes('Provider Setup') || log.includes('Navigation') || log.includes('ERROR') || log.includes('Warning') || log.includes('Has ') || log.includes('count:')) {
        console.log(`${i + 1}. ${log}`);
      }
    });
    
    console.log('=== Simple Navigation Test Complete ===');
  });
});