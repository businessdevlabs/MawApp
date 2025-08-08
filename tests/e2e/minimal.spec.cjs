const { test, expect } = require('@playwright/test');

test('minimal page test', async ({ page }) => {
  // Listen for console and errors
  page.on('console', msg => console.log(`Console: ${msg.text()}`));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Go to a simple page first
  await page.goto('http://localhost:8080/');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for any content
  const hasContent = await page.locator('body').textContent();
  console.log('Page has content:', hasContent && hasContent.length > 0);
});