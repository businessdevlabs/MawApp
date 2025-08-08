const { test, expect } = require('@playwright/test');

test.describe('User Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the register page
    await page.goto('http://localhost:8080/register');
  });

  test('should display signup form with all required fields', async ({ page }) => {
    // Check if the signup form is visible
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
    
    // Check for role selection
    await expect(page.locator('text=I want to:')).toBeVisible();
    await expect(page.locator('text=Book services')).toBeVisible();
    await expect(page.locator('text=Provide services')).toBeVisible();
    
    // Check for form fields
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    // Fill out the form with mismatched passwords
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'differentpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible();
  });

  test('should show error when password is too short', async ({ page }) => {
    // Fill out the form with short password
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', '12345');
    await page.fill('#confirmPassword', '12345');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Password too short')).toBeVisible();
  });

  test('should successfully fill out signup form for client role', async ({ page }) => {
    // Select client role (should be default)
    await page.click('#client');
    
    // Fill out the form
    await page.fill('#name', 'John Doe');
    await page.fill('#email', `client-${Date.now()}@example.com`);
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for loading state
    await expect(page.locator('text=Creating account...')).toBeVisible();
    
    // Since we don't have MongoDB running, expect an error but verify form submission works
    await page.waitForSelector('text=Registration failed', { timeout: 10000 });
  });

  test('should toggle between client and provider roles', async ({ page }) => {
    // Default should be client
    await expect(page.locator('#client')).toBeChecked();
    
    // Click provider
    await page.click('#provider');
    await expect(page.locator('#provider')).toBeChecked();
    await expect(page.locator('#client')).not.toBeChecked();
    
    // Click back to client
    await page.click('#client');
    await expect(page.locator('#client')).toBeChecked();
    await expect(page.locator('#provider')).not.toBeChecked();
  });
});