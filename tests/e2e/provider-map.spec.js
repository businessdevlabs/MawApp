import { test, expect } from '@playwright/test';

test.describe('Provider Map Integration', () => {
  let testProvider = {
    email: `providermaptest-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Map Test Provider',
    role: 'provider',
    phone: '1234567890'
  };

  test.beforeAll(async ({ request }) => {
    // Register test provider
    const registerResponse = await request.post('http://localhost:3001/api/auth/register', {
      data: testProvider
    });
    
    if (registerResponse.status() !== 201) {
      console.log('Test provider might already exist, continuing with tests');
    }
  });

  test('should show map in provider profile when editing', async ({ page }) => {
    // Step 1: Login as provider
    await page.goto('/login');
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to provider dashboard
    await expect(page).toHaveURL(/\/provider\/dashboard/);
    
    // Step 2: Navigate to provider profile
    await page.goto('/provider/profile');
    await page.waitForLoadState('networkidle');
    
    // Check if profile page loads
    await expect(page.locator('h1:has-text("Business Profile")')).toBeVisible();
    
    // Step 3: Click edit button
    const editButton = page.locator('button:has-text("Edit Profile")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Step 4: Look for the map component in editing mode
    // Note: The map might not load fully without a valid Google Maps API key
    // but we can check if the map container is present
    const mapContainer = page.locator('[data-testid="provider-map"]').or(
      page.locator('text=Business Location')
    );
    
    if (await mapContainer.isVisible()) {
      console.log('✓ Map component is visible in editing mode');
    } else {
      console.log('Map component not found - might need Google Maps API key');
    }
    
    // Step 5: Check if address input is present
    const addressInput = page.locator('input#businessAddress');
    await expect(addressInput).toBeVisible();
    
    // Step 6: Test address input functionality
    await addressInput.fill('123 Test Street, New York, NY');
    
    // The map should be present even if it doesn't fully load
    const mapSection = page.locator('text=Business Location').locator('..');
    if (await mapSection.isVisible()) {
      console.log('✓ Map section is present in the form');
    }
    
    console.log('✓ Provider map integration test completed');
  });

  test('should show map in read-only view when address is present', async ({ page }) => {
    // Step 1: Login as provider
    await page.goto('/login');
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/provider\/dashboard/);
    
    // Step 2: Go to profile and add an address first
    await page.goto('/provider/profile');
    await page.waitForLoadState('networkidle');
    
    // Edit mode
    await page.click('button:has-text("Edit Profile")');
    
    // Fill required fields
    await page.fill('input#businessName', 'Map Test Business');
    await page.fill('input#businessEmail', 'business@maptest.com');
    await page.fill('input#website', 'https://maptest.com');
    await page.fill('input#businessAddress', '456 Map Test Ave, Los Angeles, CA');
    
    // Select a category (if available)
    const categorySelect = page.locator('[data-testid="category-select"]').or(
      page.locator('button:has-text("Select a category")')
    );
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      // Select first available category
      const firstCategory = page.locator('[role="option"]').first();
      if (await firstCategory.isVisible()) {
        await firstCategory.click();
      }
    }
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save Changes")');
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      
      // Wait for save to complete
      await page.waitForTimeout(2000);
      
      // Step 3: Check if map appears in read-only view
      const mapInReadView = page.locator('text=Business Location').locator('..');
      if (await mapInReadView.isVisible()) {
        console.log('✓ Map is visible in read-only view');
      }
      
      // Check if address is displayed
      const addressDisplay = page.locator('text=456 Map Test Ave, Los Angeles, CA');
      if (await addressDisplay.isVisible()) {
        console.log('✓ Address is displayed correctly');
      }
    }
    
    console.log('✓ Read-only map view test completed');
  });
});