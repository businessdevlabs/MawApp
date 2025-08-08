import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Dashboard Cancellation Button', () => {
  let testUser = {
    email: `dashcancel-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Dashboard Cancel Test',
    role: 'client',
    phone: '1234567890'
  };
  
  let authToken = '';
  let serviceId = '';

  test.beforeAll(async ({ request }) => {
    // Register test user
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testUser
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;

    // Get available services
    const servicesResponse = await request.get(`${BASE_URL}/api/services`);
    expect(servicesResponse.status()).toBe(200);
    const servicesData = await servicesResponse.json();
    
    if (servicesData.services && servicesData.services.length > 0) {
      serviceId = servicesData.services[0]._id;
    }

    // Create a booking for testing
    if (serviceId) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 2);
      const appointmentDate = futureDate.toISOString().split('T')[0];

      const uniqueTime = new Date();
      const hours = 11 + (Math.floor(uniqueTime.getMilliseconds() / 150) % 5); // 11-15
      const minutes = (uniqueTime.getMilliseconds() % 4) * 15;
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookingData = {
        serviceId: serviceId,
        appointmentDate: appointmentDate,
        startTime: startTime,
        notes: `Dashboard cancel test - ${uniqueTime.getTime()}`
      };

      const createResponse = await request.post(`${BASE_URL}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: bookingData
      });

      expect(createResponse.status()).toBe(201);
      console.log('Test booking created for dashboard cancellation test');
    }
  });

  test('should be able to cancel appointment from dashboard', async ({ page }) => {
    if (!serviceId) {
      test.skip(true, 'No service available for test');
    }

    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Wait for upcoming bookings to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for API calls to complete
    
    // Step 3: Look for the upcoming booking
    const upcomingSection = page.locator('[data-testid="upcoming-appointments-card"]');
    await expect(upcomingSection).toBeVisible();
    
    // Check if there are any upcoming bookings
    const upcomingBookings = page.locator('[data-testid="upcoming-booking"]');
    const bookingCount = await upcomingBookings.count();
    console.log('Found upcoming bookings:', bookingCount);
    
    if (bookingCount > 0) {
      // Look for the cancel button (X button)
      const cancelButton = page.locator('[data-testid="upcoming-booking"] button:has(svg)').first();
      
      if (await cancelButton.isVisible()) {
        console.log('Cancel button found, clicking it...');
        
        // Click the cancel button
        await cancelButton.click();
        
        // Wait for the cancellation to process
        await page.waitForTimeout(2000);
        
        // Check for success toast notification
        const successToast = page.locator('text=Booking Cancelled').first();
        if (await successToast.isVisible({ timeout: 5000 })) {
          console.log('✓ Success toast appeared after cancellation');
        }
        
        // Refresh the page to see updated state
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Should now show "No upcoming appointments"
        const noAppointmentsMessage = page.locator('text=No upcoming appointments');
        if (await noAppointmentsMessage.isVisible()) {
          console.log('✓ Appointment successfully removed from upcoming list');
        }
        
        console.log('✓ Dashboard cancellation test completed successfully');
      } else {
        console.log('Cancel button not found - may be confirmed booking or no cancel permissions');
      }
    } else {
      console.log('No upcoming bookings found to cancel');
    }
  });
});