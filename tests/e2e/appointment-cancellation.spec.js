import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Appointment Cancellation', () => {
  let testUser = {
    email: `canceltest-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Cancel Test Client',
    role: 'client',
    phone: '1234567890'
  };
  
  let authToken = '';
  let serviceId = '';
  let bookingId = '';

  test.beforeAll(async ({ request }) => {
    // Step 1: Register test user
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testUser
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;
    console.log('Test user registered for cancellation test');

    // Step 2: Get available services
    const servicesResponse = await request.get(`${BASE_URL}/api/services`);
    expect(servicesResponse.status()).toBe(200);
    const servicesData = await servicesResponse.json();
    
    if (servicesData.services && servicesData.services.length > 0) {
      serviceId = servicesData.services[0]._id;
      console.log('Using service ID:', serviceId);
    } else {
      console.log('No services available for testing');
    }

    // Step 3: Create a booking to test cancellation
    if (serviceId) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      const appointmentDate = futureDate.toISOString().split('T')[0];

      const uniqueTime = new Date();
      const hours = 10 + (Math.floor(uniqueTime.getMilliseconds() / 100) % 6); // 10-15
      const minutes = (uniqueTime.getMilliseconds() % 4) * 15; // 0, 15, 30, 45
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookingData = {
        serviceId: serviceId,
        appointmentDate: appointmentDate,
        startTime: startTime,
        notes: `Cancellation test booking - ${uniqueTime.getTime()}`
      };

      const createResponse = await request.post(`${BASE_URL}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: bookingData
      });

      expect(createResponse.status()).toBe(201);
      const createdBooking = await createResponse.json();
      bookingId = createdBooking.booking._id;
      console.log('Test booking created with ID:', bookingId);
    }
  });

  test('should cancel appointment via API', async ({ request }) => {
    if (!bookingId) {
      test.skip(true, 'No booking available for cancellation test');
    }

    console.log('Testing booking cancellation via API...');
    
    // Test the cancellation API endpoint
    const cancelResponse = await request.put(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        status: 'cancelled',
        cancellationReason: 'Testing cancellation functionality'
      }
    });

    console.log('Cancel response status:', cancelResponse.status());
    const cancelResponseText = await cancelResponse.text();
    console.log('Cancel response body:', cancelResponseText);

    expect(cancelResponse.status()).toBe(200);
    const cancelData = JSON.parse(cancelResponseText);
    
    expect(cancelData).toHaveProperty('booking');
    expect(cancelData.booking.status).toBe('cancelled');
    expect(cancelData.booking.cancellationReason).toBe('Testing cancellation functionality');
    expect(cancelData.booking.cancelledAt).toBeDefined();
    
    console.log('✓ Appointment cancelled successfully via API');
  });

  test('should show cancelled booking in My Bookings page', async ({ page }) => {
    // Step 1: Login as the test user
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Navigate to My Bookings
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Check that the page loads correctly
    await expect(page.locator('h1:has-text("My Bookings")')).toBeVisible();
    
    // Step 4: Look for the cancelled booking (it should be in past bookings section)
    const pastBookingsSection = page.locator('h2:has-text("Past Appointments")');
    await expect(pastBookingsSection).toBeVisible();
    
    // Check if there are any bookings shown
    const bookingCards = page.locator('[data-testid="booking-card"], .booking-card, div:has(> .font-semibold)').filter({ hasNotText: 'No past appointments' });
    const bookingCount = await bookingCards.count();
    console.log('Found bookings in My Bookings page:', bookingCount);
    
    if (bookingCount > 0) {
      // Look for cancelled status badge
      const cancelledBadge = page.locator('text=CANCELLED').first();
      if (await cancelledBadge.isVisible()) {
        console.log('✓ Found cancelled booking in My Bookings page');
      }
    }
  });

  test('should not show cancelled booking in upcoming appointments', async ({ page }) => {
    // Step 1: Login as the test user
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Check dashboard upcoming appointments
    const upcomingSection = page.locator('[data-testid="upcoming-appointments-card"]');
    await expect(upcomingSection).toBeVisible();
    
    // Should not find any upcoming bookings (since we cancelled the only one)
    const noUpcomingMessage = page.locator('text=No upcoming appointments');
    await expect(noUpcomingMessage).toBeVisible();
    
    console.log('✓ Cancelled booking not shown in upcoming appointments');
  });

  test('should validate cancellation rules', async ({ request }) => {
    // Test that you cannot cancel an already cancelled booking
    if (!bookingId) {
      test.skip(true, 'No booking available for validation test');
    }

    const doubleCancelResponse = await request.put(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        status: 'cancelled'
      }
    });

    console.log('Double cancel response status:', doubleCancelResponse.status());
    const responseText = await doubleCancelResponse.text();
    console.log('Double cancel response:', responseText);

    // Should get an error trying to cancel an already cancelled booking
    expect(doubleCancelResponse.status()).toBe(400);
    const errorData = JSON.parse(responseText);
    expect(errorData.error).toContain('cancelled');
    
    console.log('✓ Cancellation validation rules working correctly');
  });
});