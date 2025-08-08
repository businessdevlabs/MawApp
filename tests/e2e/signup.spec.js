import { test, expect } from '@playwright/test';

test.describe('User Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the register page
    await page.goto('/register');
  });

  test('should display signup form with all required fields', async ({ page }) => {
    // Debug: Take a screenshot and log page content
    await page.screenshot({ path: 'register-debug.png' });
    const pageContent = await page.content();
    console.log('Page HTML length:', pageContent.length);
    
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    
    console.log('Number of forms:', forms);
    console.log('Number of inputs:', inputs);
    console.log('Number of buttons:', buttons);
    
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

  test('should show validation errors for invalid inputs', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    // We can check if we're still on the register page
    await expect(page).toHaveURL('/register');
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
    
    // Note: Since we don't have a real MongoDB connection in tests,
    // this will likely show an error, but we can verify the form submission works
  });

  test('should successfully fill out signup form for provider role', async ({ page }) => {
    // Select provider role
    await page.click('#provider');
    
    // Fill out the form
    await page.fill('#name', 'Jane Smith');
    await page.fill('#email', `provider-${Date.now()}@example.com`);
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for loading state
    await expect(page.locator('text=Creating account...')).toBeVisible();
  });

  test('should have working navigation to login page', async ({ page }) => {
    // Click the "Sign in" link
    await page.click('text=Sign in');
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should have responsive design elements', async ({ page }) => {
    // Check for gradient background
    await expect(page.locator('.bg-gradient-to-br')).toBeVisible();
    
    // Check for card container
    await expect(page.locator('.shadow-xl')).toBeVisible();
    
    // Check for calendar icon
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should handle form field interactions correctly', async ({ page }) => {
    // Test input focus and typing
    await page.click('#name');
    await page.type('#name', 'Test User');
    await expect(page.locator('#name')).toHaveValue('Test User');
    
    // Test email field
    await page.click('#email');
    await page.type('#email', 'test@example.com');
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    
    // Test password fields
    await page.click('#password');
    await page.type('#password', 'mypassword');
    await expect(page.locator('#password')).toHaveValue('mypassword');
    
    await page.click('#confirmPassword');
    await page.type('#confirmPassword', 'mypassword');
    await expect(page.locator('#confirmPassword')).toHaveValue('mypassword');
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