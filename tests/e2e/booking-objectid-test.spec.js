import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('ObjectId Bug Test', () => {
  let testUser = {
    email: `objectidtest-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'ObjectId Test Client',
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
    console.log('Test user registered');

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

  test('should test upcoming bookings API with far future date', async ({ request }) => {
    // Skip if no services available
    if (!serviceId) {
      test.skip(true, 'No services available');
    }

    // Use a far future date to avoid conflicts - 6 months from now
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const appointmentDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Use a truly unique time based on milliseconds to avoid any conflicts
    const uniqueTime = new Date();
    const baseHour = 9;
    const hourOffset = Math.floor(uniqueTime.getMilliseconds() / 125); // 0-7 range
    const hours = baseHour + (hourOffset % 8); // 9-16
    const minutes = (uniqueTime.getMilliseconds() % 4) * 15; // 0, 15, 30, 45
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const bookingData = {
      serviceId: serviceId,
      appointmentDate: appointmentDate,
      startTime: startTime,
      notes: `ObjectId test booking - ${uniqueTime.getTime()}`
    };

    console.log('Creating booking with data:', bookingData);

    // Step 1: Create a booking
    const createResponse = await request.post(`${BASE_URL}/api/bookings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: bookingData
    });

    console.log('Create booking response status:', createResponse.status());
    const createResponseText = await createResponse.text();
    console.log('Create booking response body:', createResponseText);

    expect(createResponse.status()).toBe(201);
    const createdBooking = JSON.parse(createResponseText);
    console.log('Created booking ID:', createdBooking.booking._id);

    // Step 2: Test upcoming bookings API directly
    console.log('Testing upcoming bookings API...');
    const upcomingResponse = await request.get(`${BASE_URL}/api/bookings/upcoming`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Upcoming bookings response status:', upcomingResponse.status());
    const upcomingResponseText = await upcomingResponse.text();
    console.log('Upcoming bookings response body:', upcomingResponseText);

    // This should succeed now that we fixed the ObjectId issue
    expect(upcomingResponse.status()).toBe(200);
    const upcomingData = JSON.parse(upcomingResponseText);
    
    expect(upcomingData).toHaveProperty('bookings');
    expect(Array.isArray(upcomingData.bookings)).toBeTruthy();
    console.log(`Found ${upcomingData.bookings.length} upcoming bookings`);

    // The booking should be in the upcoming list
    const foundBooking = upcomingData.bookings.find(b => b._id === createdBooking.booking._id);
    expect(foundBooking).toBeDefined();
    console.log('Successfully found booking in upcoming list!');
  });
});