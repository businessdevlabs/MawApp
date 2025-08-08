import { test, expect } from '@playwright/test';

test.describe('Services Page Debug', () => {
  test('debug services page selectors', async ({ page }) => {
    console.log('Navigating to services page...');
    await page.goto('http://localhost:8080/services');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/services-page-debug.png', fullPage: true });
    
    // Check what's on the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Look for various selectors that might contain service cards
    const possibleSelectors = [
      '.grid',
      '[class*="grid"]',
      '.group',
      '[class*="group"]',
      '.card',
      '[class*="card"]',
      '[data-testid*="service"]',
      'article',
      '.service',
      '[class*="service"]'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${elements} elements found`);
    }
    
    // Check for services count text
    const resultsText = page.locator('text=/\\d+ services found/');
    if (await resultsText.count() > 0) {
      const text = await resultsText.textContent();
      console.log('Results text found:', text);
    } else {
      console.log('No results text found');
    }
    
    // Look for the main content area
    const mainContent = page.locator('main, [role="main"], .container');
    const mainCount = await mainContent.count();
    console.log(`Main content areas: ${mainCount}`);
    
    if (mainCount > 0) {
      const mainText = await mainContent.first().textContent();
      console.log('Main content preview:', mainText.substring(0, 200));
    }
    
    // Check if we can find the services grid by looking for cards with service-like content
    const cardLikeElements = page.locator('div').filter({ hasText: /Book Now|Price|\$\d+/ });
    const cardCount = await cardLikeElements.count();
    console.log(`Elements with service-like content: ${cardCount}`);
    
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const cardText = await cardLikeElements.nth(i).textContent();
        console.log(`Card ${i + 1} text:`, cardText.substring(0, 100));
      }
    }
  });
});