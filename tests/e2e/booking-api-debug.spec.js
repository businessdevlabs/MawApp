import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Booking API Debug', () => {
  let testUser = {
    email: `debugclient-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Debug Test Client',
    role: 'client',
    phone: '1234567890'
  };
  
  let authToken = '';
  let serviceId = '';

  test.beforeAll(async ({ request }) => {
    // Step 1: Register test user
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testUser
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;
    console.log('Test user registered with token:', authToken);

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
  });

  test('should create booking and retrieve it via upcoming API', async ({ request }) => {
    // Skip if no services available
    if (!serviceId) {
      test.skip(true, 'No services available');
    }

    // Step 1: Create a booking for next week to avoid conflicts
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const appointmentDate = nextWeek.toISOString().split('T')[0]; // YYYY-MM-DD

    // Use a unique time based on current timestamp
    const now = new Date();
    const hour = (9 + (now.getMinutes() % 8)); // 9-16 (9am-4pm)
    const minute = (now.getSeconds() % 2) * 30; // 00 or 30
    const availableTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const bookingData = {
      serviceId: serviceId,
      appointmentDate: appointmentDate,
      startTime: availableTime,
      notes: `Test booking from API debug - ${now.getTime()}`
    };

    console.log('Creating booking with data:', bookingData);

    const createResponse = await request.post(`${BASE_URL}/api/bookings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: bookingData
    });

    console.log('Create booking response status:', createResponse.status());
    const createResponseText = await createResponse.text();
    console.log('Create booking response body:', createResponseText);

    if (createResponse.status() !== 201) {
      console.error('Failed to create booking');
      return;
    }

    const createdBooking = JSON.parse(createResponseText);
    console.log('Created booking:', JSON.stringify(createdBooking, null, 2));

    // Step 2: Wait a bit for database consistency
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Retrieve upcoming bookings
    const upcomingResponse = await request.get(`${BASE_URL}/api/bookings/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Upcoming bookings response status:', upcomingResponse.status());
    const upcomingResponseText = await upcomingResponse.text();
    console.log('Upcoming bookings response body:', upcomingResponseText);

    expect(upcomingResponse.status()).toBe(200);
    const upcomingData = JSON.parse(upcomingResponseText);
    
    expect(upcomingData).toHaveProperty('bookings');
    expect(Array.isArray(upcomingData.bookings)).toBeTruthy();
    expect(upcomingData.bookings.length).toBeGreaterThan(0);

    // Step 4: Verify the booking is in the upcoming list
    const foundBooking = upcomingData.bookings.find(b => b._id === createdBooking.booking._id);
    expect(foundBooking).toBeDefined();
    console.log('Found booking in upcoming list:', JSON.stringify(foundBooking, null, 2));
  });

  test('should test direct database query', async ({ request }) => {
    // Test the general bookings endpoint to see what's in the database
    const allBookingsResponse = await request.get(`${BASE_URL}/api/bookings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('All bookings response status:', allBookingsResponse.status());
    const allBookingsText = await allBookingsResponse.text();
    console.log('All bookings response body:', allBookingsText);

    if (allBookingsResponse.status() === 200) {
      const allBookingsData = JSON.parse(allBookingsText);
      console.log('Total bookings in database:', allBookingsData.bookings?.length || 0);
      
      if (allBookingsData.bookings && allBookingsData.bookings.length > 0) {
        console.log('Sample booking structure:', JSON.stringify(allBookingsData.bookings[0], null, 2));
      }
    }
  });
});