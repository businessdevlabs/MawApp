import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Provider Map Coordinates', () => {
  let testProvider = {
    email: `coordinates-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Coordinates Test Provider',
    role: 'provider',
    phone: '1234567890'
  };

  let authToken = '';

  test.beforeAll(async ({ request }) => {
    // Register test provider
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;
    console.log('Test provider registered for coordinates test');
  });

  test('should save coordinates when updating provider profile via API', async ({ request }) => {
    // Step 1: Update provider profile with address and coordinates
    const profileData = {
      businessName: 'Coordinates Test Business',
      businessEmail: 'coordinates@test.com',
      website: 'https://coordinatestest.com',
      businessAddress: '123 Test Street, New York, NY',
      coordinates: {
        lat: 40.7831,
        lng: -73.9712
      }
    };

    console.log('Updating provider profile with coordinates:', profileData.coordinates);

    const updateResponse = await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: profileData
    });

    console.log('Update response status:', updateResponse.status());
    const updateResponseText = await updateResponse.text();
    console.log('Update response body:', updateResponseText);

    expect(updateResponse.status()).toBe(200);
    const updateData = JSON.parse(updateResponseText);
    
    expect(updateData).toHaveProperty('provider');
    expect(updateData.provider.businessName).toBe(profileData.businessName);
    expect(updateData.provider.businessAddress).toBe(profileData.businessAddress);
    
    // Check if coordinates are saved
    expect(updateData.provider.coordinates).toBeDefined();
    expect(updateData.provider.coordinates.lat).toBe(profileData.coordinates.lat);
    expect(updateData.provider.coordinates.lng).toBe(profileData.coordinates.lng);

    console.log('✓ Coordinates saved successfully:', updateData.provider.coordinates);

    // Step 2: Retrieve provider profile to verify persistence
    const getResponse = await request.get(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status()).toBe(200);
    const getData = await getResponse.json();
    
    expect(getData.provider.coordinates).toBeDefined();
    expect(getData.provider.coordinates.lat).toBe(profileData.coordinates.lat);
    expect(getData.provider.coordinates.lng).toBe(profileData.coordinates.lng);

    console.log('✓ Coordinates persisted correctly:', getData.provider.coordinates);
  });

  test('should handle coordinates update via frontend', async ({ page }) => {
    // This test would require a Google Maps API key to work fully
    // For now, we'll test the UI elements are present
    
    // Step 1: Login as provider
    await page.goto('/login');
    await page.fill('input[type="email"]', testProvider.email);
    await page.fill('input[type="password"]', testProvider.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/provider\/dashboard/);
    
    // Step 2: Navigate to provider profile
    await page.goto('/provider/profile');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Click edit button
    const editButton = page.locator('button:has-text("Edit Profile")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Step 4: Check if map component is present
    const mapComponent = page.locator('[data-testid="provider-map"]');
    await expect(mapComponent).toBeVisible();
    
    // Step 5: Check if address input updates when changed
    const addressInput = page.locator('input#businessAddress');
    await expect(addressInput).toBeVisible();
    
    // Fill in an address
    await addressInput.fill('456 Updated Street, Los Angeles, CA');
    
    console.log('✓ Map component is present and address input works');
    
    // Note: Full map interaction testing would require Google Maps API key
    // The actual coordinate saving is tested via API above
  });
});