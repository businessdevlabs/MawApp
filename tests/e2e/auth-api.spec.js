import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Auth API Tests', () => {
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User',
    role: 'client',
    phone: '1234567890'
  };
  
  let authToken = '';

  test('should register a new user', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testUser
    });

    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('User registered successfully');
    expect(responseBody.user.email).toBe(testUser.email);
    expect(responseBody.user.fullName).toBe(testUser.fullName);
    expect(responseBody.user.role).toBe(testUser.role);
    expect(responseBody.token).toBeDefined();
    
    // Store token for later tests
    authToken = responseBody.token;
  });

  test('should not register user with existing email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testUser
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('User already exists with this email');
  });

  test('should login with valid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Login successful');
    expect(responseBody.user.email).toBe(testUser.email);
    expect(responseBody.token).toBeDefined();
    
    // Update token
    authToken = responseBody.token;
  });

  test('should not login with invalid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: testUser.email,
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid email or password');
  });

  test('should logout successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/logout`);

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Logout successful');
  });

  test('should verify valid token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Token is valid');
    expect(responseBody.user.email).toBe(testUser.email);
  });

  test('should reject invalid token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid token');
  });

  test('should get user profile with valid token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.user.email).toBe(testUser.email);
    expect(responseBody.user.fullName).toBe(testUser.fullName);
  });
});