const { test, expect } = require('@playwright/test');

test.describe('HTML Signup Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-signup.html');
  });

  test('should display signup form with all required fields', async ({ page }) => {
    // Check if the signup form is visible
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();
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

  test('should successfully fill out and submit signup form', async ({ page }) => {
    // Select client role (should be default)
    await expect(page.locator('#client')).toBeChecked();
    
    // Fill out the form
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for loading state
    await expect(page.locator('text=Creating account...')).toBeVisible();
    
    // Wait for success message
    await expect(page.locator('text=Account created successfully!')).toBeVisible({ timeout: 2000 });
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

  test('should validate email format', async ({ page }) => {
    // Fill out form with invalid email
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const validationMessage = await emailInput.evaluate((el) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});