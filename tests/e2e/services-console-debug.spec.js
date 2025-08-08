import { test, expect } from '@playwright/test';

test.describe('Debug Console Errors', () => {
  test('check for JavaScript errors that might prevent category loading', async ({ page }) => {
    const consoleMessages = [];
    const errors = [];
    
    // Listen for console messages
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    console.log('Navigating to services page...');
    await page.goto('http://localhost:8080/services');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    console.log('Console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors Found:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\n✅ No JavaScript errors found');
    }
    
    // Check network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    
    // Reload to capture network requests
    console.log('\nReloading to capture network requests...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('\nAPI Network Requests:');
    networkRequests.forEach(req => console.log(`  ${req}`));
    
    // Check if categories request was made
    const categoriesRequest = networkRequests.find(req => req.includes('/categories'));
    if (categoriesRequest) {
      console.log(`\n✅ Categories API request found: ${categoriesRequest}`);
    } else {
      console.log('\n❌ No categories API request found');
    }
    
    // Check if services request was made
    const servicesRequest = networkRequests.find(req => req.includes('/services'));
    if (servicesRequest) {
      console.log(`✅ Services API request found: ${servicesRequest}`);
    } else {
      console.log('❌ No services API request found');
    }
  });
});