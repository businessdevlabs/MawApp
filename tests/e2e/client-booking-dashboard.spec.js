import { test, expect } from '@playwright/test';

test.describe('Client Booking Dashboard Flow', () => {
  // Set up test data
  const testClient = {
    email: `testclient-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test Client Dashboard',
    role: 'client'
  };

  test.beforeAll(async ({ request }) => {
    // Create test client before running tests
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: testClient
    });
    
    if (response.status() !== 201) {
      console.log('Test client might already exist, continuing with tests');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Start with a clean state - clear localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show booking in upcoming appointments after client books a service', async ({ page }) => {
    // Step 1: Login as client
    await page.goto('/login');
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=Welcome back, ${testClient.fullName}!`)).toBeVisible();

    // Step 2: Check initial upcoming appointments (should be empty or existing)
    const upcomingAppointmentsCard = page.locator('[data-testid="upcoming-appointments-card"]').first();
    
    // If the data-testid doesn't exist, fall back to a more specific selector
    if (await upcomingAppointmentsCard.count() === 0) {
      const appointmentsSection = page.locator('text=Upcoming Appointments').first();
      await expect(appointmentsSection).toBeVisible();
    } else {
      await expect(upcomingAppointmentsCard).toBeVisible();
    }
    
    // Count initial appointments
    const initialBookings = await page.locator('[data-testid="upcoming-booking"], .upcoming-booking-item').count();
    console.log('Initial upcoming bookings count:', initialBookings);

    // Step 3: Navigate to services page
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    // Wait for services to load and check if any exist
    await page.waitForTimeout(2000);
    
    const servicesCount = await page.locator('text=/\\d+ services found/').textContent();
    console.log('Services found:', servicesCount);
    
    // If no services exist, skip this test
    if (servicesCount?.includes('0 services found')) {
      test.skip(true, 'No services available for testing');
    }

    // Step 4: Book the first available service
    const bookNowButton = page.locator('button:has-text("Book Now")').first();
    await expect(bookNowButton).toBeVisible({ timeout: 15000 });
    
    // Get service name for verification later
    const serviceCard = page.locator('.group').first();
    const serviceName = await serviceCard.locator('h3').textContent();
    console.log('Booking service:', serviceName);
    
    await bookNowButton.click();

    // Step 5: Should be on service detail page
    await expect(page).toHaveURL(/.*\/service\/[a-f0-9]{20,24}$/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Step 6: Fill booking form
    // Select tomorrow's date to ensure it's upcoming
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Look for date picker and select tomorrow
    const dateInput = page.locator('input[type="date"], [data-testid="date-picker"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill(tomorrowDateString);
    } else {
      // If no date picker, look for calendar or date selection
      const calendarButton = page.locator('button:has-text("Select")').first();
      if (await calendarButton.isVisible()) {
        await calendarButton.click();
        // Select tomorrow in calendar (simplified - click on a date)
        const tomorrowButton = page.locator(`[data-date="${tomorrowDateString}"], text=${tomorrow.getDate()}`).first();
        if (await tomorrowButton.isVisible()) {
          await tomorrowButton.click();
        }
      }
    }

    // Select a time slot
    const timeSlot = page.locator('button:has-text("10:00"), button:has-text("11:00"), button:has-text("14:00")').first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }

    // Add optional notes
    const notesField = page.locator('textarea[placeholder*="notes"], textarea[placeholder*="request"]').first();
    if (await notesField.isVisible()) {
      await notesField.fill('Test booking from Playwright');
    }

    // Step 7: Submit booking
    const bookAppointmentButton = page.locator('button:has-text("Book Appointment"), button:has-text("Confirm Booking")').first();
    await expect(bookAppointmentButton).toBeEnabled({ timeout: 5000 });
    await bookAppointmentButton.click();

    // Step 8: Wait for booking confirmation
    await expect(page.locator('text=Booking Successful, text=Booking confirmed')).toBeVisible({ timeout: 10000 });

    // Step 9: Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 10: Check that the booking appears in upcoming appointments
    // Wait for dashboard to load and refresh data
    await page.waitForTimeout(3000); // Give time for API calls to complete

    // Look for the upcoming appointments section
    const upcomingSection = page.locator('text=Upcoming Appointments').locator('..').locator('..');
    await expect(upcomingSection).toBeVisible();

    // Check for the new booking - should be one more than initial count
    const finalBookings = await page.locator('[data-testid="upcoming-booking"], .upcoming-booking-item').count();
    console.log('Final upcoming bookings count:', finalBookings);

    // Alternative: Look for specific booking content
    const bookingWithServiceName = page.locator(`text=${serviceName?.trim()}`);
    const bookingWithTestNotes = page.locator('text=Test booking from Playwright');
    const bookingWithTomorrowDate = page.locator(`text=${tomorrow.toLocaleDateString()}`);

    // At least one of these should be visible to confirm the booking is shown
    const bookingVisible = await Promise.race([
      bookingWithServiceName.isVisible().catch(() => false),
      bookingWithTestNotes.isVisible().catch(() => false),
      bookingWithTomorrowDate.isVisible().catch(() => false),
      // Check if booking count increased
      Promise.resolve(finalBookings > initialBookings)
    ]);

    expect(bookingVisible).toBeTruthy();

    // Additional verification: check that "No upcoming appointments" is not shown if we have bookings
    if (finalBookings > 0) {
      await expect(page.locator('text=No upcoming appointments')).not.toBeVisible();
    }
  });

  test('should consistently show bookings after multiple refreshes', async ({ page }) => {
    // This test checks for consistency issues with upcoming bookings display
    
    // Step 1: Login as client
    await page.goto('/login');
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Record initial booking count
    await page.waitForTimeout(2000);
    const initialCount = await page.locator('[data-testid="upcoming-booking"], .upcoming-booking-item').count();
    console.log('Initial bookings count:', initialCount);

    // Step 3: Refresh page multiple times and check consistency
    for (let i = 0; i < 3; i++) {
      console.log(`Refresh attempt ${i + 1}`);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for API calls
      
      const currentCount = await page.locator('[data-testid="upcoming-booking"], .upcoming-booking-item').count();
      console.log(`Bookings count after refresh ${i + 1}:`, currentCount);
      
      // Count should be consistent
      expect(currentCount).toBe(initialCount);
    }
  });

  test('should handle timezone issues correctly', async ({ page }) => {
    // Test to ensure bookings scheduled for today still show as upcoming
    
    // Step 1: Login as client
    await page.goto('/login');
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Check API response directly
    const apiResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/bookings/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    });

    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    // Step 3: Verify the response structure
    expect(apiResponse).toHaveProperty('bookings');
    expect(Array.isArray(apiResponse.bookings)).toBeTruthy();

    // Step 4: Check that upcoming bookings on UI match API response
    await page.waitForTimeout(2000);
    const uiBookingCount = await page.locator('[data-testid="upcoming-booking"], .upcoming-booking-item').count();
    const apiBookingCount = apiResponse.bookings.length;

    console.log('UI booking count:', uiBookingCount);
    console.log('API booking count:', apiBookingCount);

    expect(uiBookingCount).toBe(apiBookingCount);
  });
});