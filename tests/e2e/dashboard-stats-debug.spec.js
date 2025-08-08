import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

test.describe('Dashboard Stats API Debug', () => {
  let testClient = {
    email: `stats-debug-${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Stats Debug Client',
    role: 'client'
  };

  test.beforeAll(async ({ request }) => {
    console.log('Creating test client...');
    
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testClient
    });
    expect(response.status()).toBe(201);
    console.log('Test client created successfully');
  });

  test('should debug dashboard stats API endpoint', async ({ request, page }) => {
    console.log('=== Dashboard Stats API Debug ===');

    // Step 1: Login to get auth token
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: testClient.email,
        password: testClient.password
      }
    });
    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token received');

    // Step 2: Test dashboard stats endpoint
    console.log('\n--- Testing /api/bookings/stats ---');
    const statsResponse = await request.get(`${BASE_URL}/api/bookings/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Stats API Status:', statsResponse.status());
    
    if (statsResponse.status() === 200) {
      const statsData = await statsResponse.json();
      console.log('Stats Response:', JSON.stringify(statsData, null, 2));
    } else {
      const errorText = await statsResponse.text();
      console.log('Stats API Error:', errorText);
    }

    // Step 3: Test regular bookings endpoint
    console.log('\n--- Testing /api/bookings ---');
    const bookingsResponse = await request.get(`${BASE_URL}/api/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Bookings API Status:', bookingsResponse.status());
    
    if (bookingsResponse.status() === 200) {
      const bookingsData = await bookingsResponse.json();
      console.log('Bookings Response Structure:', Object.keys(bookingsData));
      console.log('Number of bookings:', bookingsData.bookings?.length || 0);
      if (bookingsData.bookings?.length > 0) {
        console.log('First booking sample:', JSON.stringify(bookingsData.bookings[0], null, 2));
      }
    } else {
      const errorText = await bookingsResponse.text();
      console.log('Bookings API Error:', errorText);
    }

    // Step 4: Check frontend dashboard
    console.log('\n--- Testing Frontend Dashboard ---');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', testClient.email);
    await page.fill('input[type="password"]', testClient.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for API calls to complete
    await page.waitForTimeout(3000);
    
    // Check what the dashboard shows
    const totalBookingsCard = page.locator('[data-testid="total-bookings"]');
    if (await totalBookingsCard.isVisible()) {
      const bookingCountText = await totalBookingsCard.locator('.text-2xl').textContent();
      console.log('Frontend Total Bookings Count:', bookingCountText);
    } else {
      console.log('❌ Total bookings card not found');
    }

    // Check browser console for any API errors
    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n--- Browser Console Logs ---');
    logs.forEach(log => {
      if (log.includes('Failed') || log.includes('error') || log.includes('Error')) {
        console.log('🔴', log);
      } else if (log.includes('fetch') || log.includes('stats')) {
        console.log('🔵', log);
      }
    });

    // Step 5: Check API calls made by frontend
    console.log('\n--- Checking Network Requests ---');
    let apiRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          method: request.method(),
          url: request.url(),
          headers: Object.fromEntries(Object.entries(request.headers()).filter(([k, v]) => k.includes('auth')))
        });
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('API Requests made by frontend:');
    apiRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
      if (req.headers.authorization) {
        console.log(`   Auth: ${req.headers.authorization.substring(0, 20)}...`);
      }
    });
  });

  test('should check if bookings stats endpoint exists on server', async ({ request }) => {
    console.log('=== Checking Stats Endpoint Availability ===');

    // Create a simple GET request to see what endpoints are available
    const testEndpoints = [
      '/api/bookings/stats',
      '/api/bookings/dashboard-stats',
      '/api/user/stats',
      '/api/dashboard/stats',
      '/api/bookings'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const response = await request.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer invalid-token',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`${endpoint}: ${response.status()} ${response.statusText()}`);
        
        if (response.status() === 401) {
          console.log(`  ✅ Endpoint exists but requires auth`);
        } else if (response.status() === 404) {
          console.log(`  ❌ Endpoint not found`);
        } else {
          console.log(`  ⚠️  Unexpected status`);
        }
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }
  });
});