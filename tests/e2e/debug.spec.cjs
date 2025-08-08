const { test, expect } = require('@playwright/test');

test('debug page content', async ({ page }) => {
  // Listen for console messages and errors
  page.on('console', msg => console.log(`Console ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  await page.goto('http://localhost:8080/register');
  
  // Wait for React to render
  await page.waitForTimeout(5000);
  
  // Check if React root is there
  const reactRoot = await page.locator('#root').textContent();
  console.log('React root content preview:', reactRoot ? reactRoot.substring(0, 200) : 'No root content');
  
  // Check for loading states or error messages
  const hasLoading = await page.locator('text=Loading').isVisible();
  console.log('Has loading text:', hasLoading);
  
  // Try to find any visible text
  const allText = await page.locator('body *').allTextContents();
  console.log('All visible text:', allText.slice(0, 10));
  
  // Take a screenshot to see what's actually rendered
  await page.screenshot({ path: 'debug-register-page.png', fullPage: true });
});