import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Booking Payment Completion Tests', () => {
  let clientUser = {
    email: `client-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Client',
    role: 'client',
    phone: '1234567890'
  };

  let providerUser = {
    email: `provider-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Provider',
    role: 'provider',
    phone: '0987654321'
  };

  let clientAuthToken = '';
  let providerAuthToken = '';
  let serviceId = '';
  let bookingId = '';
  let selectedCategoryId = '';

  test.beforeAll(async ({ request }) => {
    // Register client user
    const clientRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: clientUser
    });
    expect(clientRegisterResponse.status()).toBe(201);
    const clientData = await clientRegisterResponse.json();
    clientAuthToken = clientData.token;

    // Register provider user
    const providerRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: providerUser
    });
    expect(providerRegisterResponse.status()).toBe(201);
    const providerData = await providerRegisterResponse.json();
    providerAuthToken = providerData.token;

    // Get available categories
    const categoriesResponse = await request.get(`${BASE_URL}/api/categories`);
    expect(categoriesResponse.status()).toBe(200);
    const categoriesData = await categoriesResponse.json();
    selectedCategoryId = categoriesData.categories[0]._id;

    // Update provider profile
    const profileData = {
      businessName: 'Test Payment Business',
      businessDescription: 'A test business for payment verification',
      businessAddress: '123 Test Street, Test City',
      businessPhone: '+1-555-TEST',
      businessEmail: 'business@test.com'
    };

    await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` },
      data: profileData
    });

    // Create a service
    const serviceData = {
      name: 'Payment Test Service',
      description: 'A test service for payment completion verification',
      category: selectedCategoryId,
      price: 100.00,
      duration: 60,
      maxBookingsPerDay: 5,
      requirements: ['Valid payment method'],
      tags: ['test', 'payment']
    };

    const serviceResponse = await request.post(`${BASE_URL}/api/provider/services`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` },
      data: serviceData
    });
    expect(serviceResponse.status()).toBe(201);
    const serviceResponseData = await serviceResponse.json();
    serviceId = serviceResponseData.service._id;
    console.log('Created test service with ID:', serviceId);
  });

  test('should create booking, complete it, and verify payment status', async ({ request }) => {
    // Step 1: Create a booking
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const appointmentDate = nextWeek.toISOString().split('T')[0];

    const bookingData = {
      serviceId: serviceId,
      appointmentDate: appointmentDate,
      startTime: '10:00',
      notes: 'Test booking for payment completion verification'
    };

    console.log('Creating booking with data:', bookingData);

    const createResponse = await request.post(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${clientAuthToken}` },
      data: bookingData
    });

    expect(createResponse.status()).toBe(201);
    const createdBooking = await createResponse.json();
    bookingId = createdBooking.booking._id;
    
    console.log('Created booking with ID:', bookingId);
    console.log('Initial booking data:', JSON.stringify(createdBooking.booking, null, 2));

    // Verify initial booking state
    expect(createdBooking.booking.status).toBe('pending');
    expect(createdBooking.booking.paymentStatus).toBe('pending');
    expect(createdBooking.booking.totalAmount).toBe(100.00);

    // Step 2: Provider confirms the booking
    const confirmResponse = await request.put(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` },
      data: { status: 'confirmed' }
    });

    expect(confirmResponse.status()).toBe(200);
    const confirmedBooking = await confirmResponse.json();
    console.log('Confirmed booking:', JSON.stringify(confirmedBooking.booking, null, 2));

    // Verify confirmed state
    expect(confirmedBooking.booking.status).toBe('confirmed');
    expect(confirmedBooking.booking.paymentStatus).toBe('pending'); // Should still be pending

    // Step 3: Provider completes the service
    const completeResponse = await request.put(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` },
      data: { status: 'completed' }
    });

    expect(completeResponse.status()).toBe(200);
    const completedBooking = await completeResponse.json();
    console.log('Completed booking:', JSON.stringify(completedBooking.booking, null, 2));

    // Step 4: Verify payment status is automatically updated
    expect(completedBooking.booking.status).toBe('completed');
    expect(completedBooking.booking.paymentStatus).toBe('paid'); // Should now be paid
    expect(completedBooking.booking.completedAt).toBeDefined();
    expect(new Date(completedBooking.booking.completedAt)).toBeInstanceOf(Date);

    console.log('✅ Payment status correctly updated to "paid" when booking completed');
  });

  test('should retrieve completed booking through provider payments endpoint', async ({ request }) => {
    // Wait a moment for database consistency
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 1: Get provider payments
    const paymentsResponse = await request.get(`${BASE_URL}/api/provider/payments`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` }
    });

    expect(paymentsResponse.status()).toBe(200);
    const paymentsData = await paymentsResponse.json();
    console.log('Provider payments response:', JSON.stringify(paymentsData, null, 2));

    // Step 2: Verify the payment appears in the list
    expect(paymentsData.payments).toBeDefined();
    expect(Array.isArray(paymentsData.payments)).toBe(true);
    expect(paymentsData.payments.length).toBeGreaterThan(0);

    // Find our completed booking in the payments list
    const payment = paymentsData.payments.find(p => p.bookingId._id === bookingId);
    expect(payment).toBeDefined();

    // Step 3: Verify payment details
    expect(payment.amount).toBe(100.00);
    expect(payment.status).toBe('completed');
    expect(payment.paymentMethod).toBeDefined();
    expect(payment.transactionId).toBeDefined();
    expect(payment.paymentDate).toBeDefined();
    expect(payment.platformFee).toBeGreaterThan(0);
    expect(payment.netAmount).toBeLessThan(payment.amount);
    expect(payment.netAmount).toBe(payment.amount - payment.platformFee);

    // Step 4: Verify payment summary statistics
    expect(paymentsData.summary).toBeDefined();
    expect(paymentsData.summary.totalRevenue).toBeGreaterThanOrEqual(100.00);
    expect(paymentsData.summary.totalFees).toBeGreaterThan(0);
    expect(paymentsData.summary.totalNetRevenue).toBeGreaterThan(0);
    expect(paymentsData.summary.averagePayment).toBeGreaterThan(0);

    console.log('✅ Completed booking successfully appears in payments endpoint');
    console.log('Payment details:', {
      amount: payment.amount,
      platformFee: payment.platformFee,
      netAmount: payment.netAmount,
      transactionId: payment.transactionId
    });
  });

  test('should verify payment appears in client bookings as completed', async ({ request }) => {
    // Get client bookings to verify status
    const clientBookingsResponse = await request.get(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${clientAuthToken}` }
    });

    expect(clientBookingsResponse.status()).toBe(200);
    const clientBookingsData = await clientBookingsResponse.json();

    // Find our booking
    const clientBooking = clientBookingsData.bookings.find(b => b._id === bookingId);
    expect(clientBooking).toBeDefined();
    expect(clientBooking.status).toBe('completed');
    expect(clientBooking.paymentStatus).toBe('paid');

    console.log('✅ Client can see completed booking with paid status');
  });

  test('should not allow updating completed booking status', async ({ request }) => {
    // Try to update a completed booking - should fail
    const updateResponse = await request.put(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` },
      data: { status: 'cancelled' }
    });

    expect(updateResponse.status()).toBe(400);
    const errorData = await updateResponse.json();
    expect(errorData.error).toContain('Cannot update completed');

    console.log('✅ Completed bookings correctly protected from status changes');
  });

  test('should calculate platform fees correctly', async ({ request }) => {
    // Get the payment details to verify fee calculation
    const paymentsResponse = await request.get(`${BASE_URL}/api/provider/payments`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` }
    });

    const paymentsData = await paymentsResponse.json();
    const payment = paymentsData.payments.find(p => p.bookingId._id === bookingId);

    // Verify fee calculation (5% platform fee)
    const expectedFee = payment.amount * 0.05;
    const expectedNet = payment.amount - expectedFee;

    expect(Math.abs(payment.platformFee - expectedFee)).toBeLessThan(0.01); // Allow for rounding
    expect(Math.abs(payment.netAmount - expectedNet)).toBeLessThan(0.01); // Allow for rounding

    console.log('✅ Platform fees calculated correctly:', {
      grossAmount: payment.amount,
      platformFee: payment.platformFee,
      netAmount: payment.netAmount,
      feePercentage: (payment.platformFee / payment.amount * 100).toFixed(2) + '%'
    });
  });

  test('should handle date filtering in payments endpoint', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Test with date range that includes today
    const filteredResponse = await request.get(`${BASE_URL}/api/provider/payments?startDate=${today}&endDate=${tomorrow}`, {
      headers: { 'Authorization': `Bearer ${providerAuthToken}` }
    });

    expect(filteredResponse.status()).toBe(200);
    const filteredData = await filteredResponse.json();
    
    // Should include our payment since it was completed today
    expect(filteredData.payments.length).toBeGreaterThan(0);

    console.log('✅ Date filtering in payments endpoint works correctly');
  });
});