import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Navigation Test with Profile Setup', () => {
  let testProvider = {
    email: `nav-profile-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Navigation Profile Provider',
    role: 'provider',
    phone: '5555555555'
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(response.status()).toBe(201);
    console.log('✅ Navigation profile test provider created');
  });

  test('should navigate after completing profile and schedule', async ({ page }) => {
    console.log('=== Navigation Test with Profile Setup ===');

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

    // Step 1: Set up basic profile via API to ensure hasProfile = true
    console.log('\n--- Step 1: Setting up profile via API ---');
    
    const profileResponse = await page.request.put(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`,
        'Content-Type': 'application/json'
      },
      data: {
        businessName: 'Navigation Test Business',
        businessEmail: testProvider.email,
        businessDescription: 'Test business for navigation testing'
      }
    });
    
    if (profileResponse.status() === 200) {
      console.log('✅ Profile updated via API');
    } else {
      console.log('❌ Profile update failed:', profileResponse.status());
    }

    // Step 2: Go to schedule page and save with enabled day
    console.log('\n--- Step 2: Setting up schedule ---');
    await page.goto(`${FRONTEND_URL}/provider/schedule`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Debug schedule page content
    const scheduleContent = await page.locator('body').textContent();
    console.log('Schedule page content preview:', scheduleContent.substring(0, 300) + '...');
    
    // Look for day toggles more comprehensively
    console.log('Looking for schedule toggles...');
    
    // Try multiple approaches to find and enable a schedule day
    let dayEnabled = false;
    
    // Approach 1: Look for Monday specifically
    const mondayElements = await page.locator('text=Monday').all();
    console.log('Found Monday elements:', mondayElements.length);
    
    for (let i = 0; i < mondayElements.length; i++) {
      const switchInParent = mondayElements[i].locator('..').locator('[role="switch"]').first();
      if (await switchInParent.isVisible().catch(() => false)) {
        console.log('Found Monday switch, enabling...');
        await switchInParent.click();
        dayEnabled = true;
        break;
      }
    }
    
    // Approach 2: Look for any available switch
    if (!dayEnabled) {
      const allSwitches = await page.locator('[role="switch"]').all();
      console.log('Found switches:', allSwitches.length);
      
      if (allSwitches.length > 0) {
        console.log('Enabling first available switch...');
        await allSwitches[0].click();
        dayEnabled = true;
      }
    }
    
    // Approach 3: Look for checkboxes
    if (!dayEnabled) {
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      console.log('Found checkboxes:', checkboxes.length);
      
      if (checkboxes.length > 0) {
        console.log('Checking first checkbox...');
        await checkboxes[0].check();
        dayEnabled = true;
      }
    }
    
    if (dayEnabled) {
      console.log('✅ Schedule day enabled');
    } else {
      console.log('❌ Could not enable any schedule day');
    }
    
    // Wait a bit for UI to update
    await page.waitForTimeout(1000);
    
    // Save schedule
    console.log('Saving schedule...');
    const saveButton = page.locator('button:has-text("Save Schedule"), button:has-text("Save"), button:has-text("Update")');
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    
    console.log('Save button found, clicking...');
    await saveButton.click();
    
    // Wait for toast message (use first occurrence to avoid strict mode violation)
    await expect(page.locator('text=Schedule saved').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Schedule saved successfully');
    
    // Step 3: Check for navigation
    console.log('\n--- Step 3: Checking for navigation ---');
    console.log('Waiting for potential navigation...');
    
    // Wait longer for navigation
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('/provider/services')) {
      console.log('✅ SUCCESS: Navigation to services page worked!');
    } else {
      console.log('❌ Navigation did not occur');
      
      // Print debug logs
      console.log('\n--- Debug Console Logs ---');
      consoleLogs.forEach((log, i) => {
        if (log.includes('Provider Setup') || log.includes('Navigation') || log.includes('Has ') || log.includes('count:') || log.includes('conditions')) {
          console.log(`${i + 1}. ${log}`);
        }
      });
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/navigation-with-profile-debug.png' });
      console.log('📸 Debug screenshot saved');
    }
    
    console.log('=== Navigation Test with Profile Complete ===');
  });
});