import { test, expect } from '@playwright/test';

test.describe('Debug Category Buttons', () => {
  test('find category buttons', async ({ page }) => {
    console.log('Navigating to services page...');
    await page.goto('http://localhost:8080/services');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Look for all buttons on the page
    const allButtons = await page.locator('button').count();
    console.log(`Total buttons found: ${allButtons}`);
    
    // Get text of all buttons
    for (let i = 0; i < Math.min(20, allButtons); i++) {
      const buttonText = await page.locator('button').nth(i).textContent();
      console.log(`Button ${i + 1}: "${buttonText}"`);
    }
    
    // Try different selectors for category buttons
    const selectors = [
      'text="All Services"',
      'text="Beauty"',
      'text="Health"',
      'button:has-text("Beauty")',
      'button:has-text("Services")',
      '[class*="button"]:has-text("Beauty")'
    ];
    
    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`Selector "${selector}": ${count} elements`);
      } catch (e) {
        console.log(`Selector "${selector}": error - ${e.message}`);
      }
    }
    
    // Check if "All Services" button exists
    const allServicesButton = page.locator('button', { hasText: 'All Services' });
    const allServicesCount = await allServicesButton.count();
    console.log(`"All Services" button count: ${allServicesCount}`);
    
    if (allServicesCount > 0) {
      const allServicesText = await allServicesButton.textContent();
      console.log(`"All Services" button text: "${allServicesText}"`);
    }
    
    // Take a screenshot to see the page
    await page.screenshot({ path: 'test-results/services-categories-debug.png', fullPage: true });
    
    // Get the HTML around the filter area
    const filterSection = page.locator('text="Search services"').locator('..').locator('..');
    if (await filterSection.count() > 0) {
      const filterHTML = await filterSection.innerHTML();
      console.log('Filter section HTML preview:', filterHTML.substring(0, 500));
    }
  });
});