const { test, expect } = require('@playwright/test');

test('debug register page', async ({ page }) => {
  // Listen for all messages
  page.on('console', msg => console.log(`Console: ${msg.text()}`));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  console.log('Navigating to register page...');
  await page.goto('http://localhost:8080/register');
  
  // Wait longer for React to render
  console.log('Waiting for page to load...');
  await page.waitForTimeout(5000);
  
  // Check what's actually on the page
  const pageContent = await page.content();
  console.log('Page HTML length:', pageContent.length);
  
  // Check for specific elements
  const forms = await page.locator('form').count();
  console.log('Number of forms:', forms);
  
  const inputs = await page.locator('input').count();
  console.log('Number of inputs:', inputs);
  
  const buttons = await page.locator('button').count();
  console.log('Number of buttons:', buttons);
  
  // Check if any text is visible
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText ? bodyText.length : 0);
  console.log('Body text preview:', bodyText ? bodyText.substring(0, 100) : 'No text');
  
  // Look for React loading indicators
  const loading = await page.locator('text=Loading').isVisible();
  console.log('Has loading indicator:', loading);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'register-debug.png', fullPage: true });
  console.log('Screenshot saved as register-debug.png');
});