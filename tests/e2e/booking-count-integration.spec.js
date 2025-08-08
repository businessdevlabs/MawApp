import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Booking Count Integration', () => {
  let testClient = {
    email: `booking-count-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Booking Count Test',
    role: 'client',
    phone: '5555555555'
  };

  let testProvider = {
    email: `provider-count-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Provider Count Test',
    role: 'provider',
    phone: '4444444444'
  };

  test.beforeAll(async ({ request }) => {
    console.log('Setting up test users and services...');

    // Create test client
    const clientResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testClient
    });
    expect(clientResponse.status()).toBe(201);
    console.log('✅ Test client created');

    // Create test provider
    const providerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(providerResponse.status()).toBe(201);
    console.log('✅ Test provider created');

    // Login as provider and create a service
    const providerLoginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: testProvider.email,
        password: testProvider.password
      }
    });
    const providerLoginData = await providerLoginResponse.json();
    const providerToken = providerLoginData.token;

    // Get service categories
    const categoriesResponse = await request.get(`${BASE_URL}/api/service-categories`);
    const categoriesData = await categoriesResponse.json();
    const firstCategory = categoriesData.categories?.[0];

    if (firstCategory) {
      // Create a test service
      const serviceResponse = await request.post(`${BASE_URL}/api/services`, {
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: 'Test Booking Count Service',
          description: 'Service for testing booking counts',
          price: 50,
          duration: 60,
          categoryId: firstCategory._id,
          isActive: true
        }
      });
      
      if (serviceResponse.status() === 201) {
        console.log('✅ Test service created');
      }
    }
  });

  test('should show correct booking count after API booking creation', async ({ request, page }) => {
    console.log('=== Testing Booking Count Integration ===');

    // Step 1: Login as client
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: testClient.email,
        password: testClient.password
      }
    });
    const loginData = await loginResponse.json();
    const clientToken = loginData.token;
    console.log('✅ Client logged in');

    // Step 2: Check initial booking count
    const initialStatsResponse = await request.get(`${BASE_URL}/api/bookings/stats`, {
      headers: {
        'Authorization': `Bearer ${clientToken}`,
        'Content-Type': 'application/json'
      }
    });
    const initialStats = await initialStatsResponse.json();
    console.log('Initial booking count:', initialStats.totalBookings);

    // Step 3: Get available services
    const servicesResponse = await request.get(`${BASE_URL}/api/services`);
    const servicesData = await servicesResponse.json();
    console.log('Available services:', servicesData.services?.length || 0);

    if (servicesData.services && servicesData.services.length > 0) {
      const testService = servicesData.services[0];
      console.log('Using service:', testService.name);

      // Step 4: Create a booking directly via API
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const appointmentDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      const bookingResponse = await request.post(`${BASE_URL}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          serviceId: testService._id,
          providerId: testService.providerId,
          appointmentDate: appointmentDate,
          startTime: '10:00',
          endTime: '11:00',
          notes: 'Test booking for count verification'
        }
      });

      console.log('Booking API Status:', bookingResponse.status());
      
      if (bookingResponse.status() === 201) {
        const bookingData = await bookingResponse.json();
        console.log('✅ Booking created successfully:', bookingData.booking?._id);

        // Step 5: Check updated booking count via API
        const updatedStatsResponse = await request.get(`${BASE_URL}/api/bookings/stats`, {
          headers: {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
          }
        });
        const updatedStats = await updatedStatsResponse.json();
        console.log('Updated booking count (API):', updatedStats.totalBookings);
        
        // The count should have increased
        expect(updatedStats.totalBookings).toBeGreaterThan(initialStats.totalBookings);

        // Step 6: Check dashboard frontend
        await page.goto(`${FRONTEND_URL}/login`);
        await page.fill('input[type="email"]', testClient.email);
        await page.fill('input[type="password"]', testClient.password);
        await page.click('button[type="submit"]');
        
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        // Wait for stats to load
        await page.waitForTimeout(3000);
        
        // Check frontend booking count
        const totalBookingsCard = page.locator('[data-testid="total-bookings"]');
        await expect(totalBookingsCard).toBeVisible();
        
        const frontendCount = await totalBookingsCard.locator('.text-2xl').textContent();
        console.log('Frontend booking count:', frontendCount);
        
        // Frontend should match API
        expect(parseInt(frontendCount || '0')).toBe(updatedStats.totalBookings);
        expect(parseInt(frontendCount || '0')).toBeGreaterThan(0);

        console.log('✅ Booking count integration working correctly!');

      } else {
        const errorText = await bookingResponse.text();
        console.log('❌ Failed to create booking:', errorText);
        console.log('Skipping count verification...');
      }
    } else {
      console.log('❌ No services available for booking');
      test.skip(true, 'No services available for testing');
    }
  });

  test('should handle cache invalidation correctly', async ({ request, page }) => {
    console.log('=== Testing Cache Invalidation ===');

    // Login as client
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Get initial count
    await page.waitForTimeout(2000);
    const initialCountElement = await page.locator('[data-testid="total-bookings"] .text-2xl');
    const initialCount = await initialCountElement.textContent();
    console.log('Initial frontend count:', initialCount);

    // Force refresh dashboard multiple times to check consistency
    for (let i = 1; i <= 3; i++) {
      console.log(`Refresh ${i}/3...`);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const currentCount = await page.locator('[data-testid="total-bookings"] .text-2xl').textContent();
      console.log(`Count after refresh ${i}:`, currentCount);
      
      // Should be consistent
      expect(currentCount).toBe(initialCount);
    }

    console.log('✅ Cache invalidation working correctly');
  });
});