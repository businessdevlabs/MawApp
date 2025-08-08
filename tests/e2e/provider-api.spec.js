import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Provider API Tests', () => {
  let providerUser = {
    email: `provider-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test Provider',
    role: 'provider',
    phone: '1234567890'
  };
  
  let authToken = '';
  let serviceId = '';
  let availableCategories = [];
  let selectedCategoryId = '';

  test.beforeAll(async ({ request }) => {
    // Register a provider user
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: providerUser
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;

    // Get available categories
    const categoriesResponse = await request.get(`${BASE_URL}/api/categories`);
    expect(categoriesResponse.status()).toBe(200);
    const categoriesData = await categoriesResponse.json();
    availableCategories = categoriesData.categories;
    selectedCategoryId = availableCategories[0]._id;
  });

  test('should get provider profile', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.provider).toBeDefined();
    expect(responseBody.provider.businessName).toBe(providerUser.fullName);
    expect(responseBody.provider.status).toBe('pending');
  });

  test('should update provider profile', async ({ request }) => {
    const profileData = {
      businessName: 'Updated Business Name',
      businessDescription: 'A comprehensive business description for testing',
      businessAddress: '123 Test Street, Test City, TC 12345',
      businessPhone: '+1-555-0123',
      businessEmail: 'business@test.com',
      website: 'https://testbusiness.com',
      category: selectedCategoryId,
      businessHours: {
        monday: { open: '09:00', close: '17:00', isOpen: true },
        tuesday: { open: '09:00', close: '17:00', isOpen: true },
        wednesday: { open: '09:00', close: '17:00', isOpen: true },
        thursday: { open: '09:00', close: '17:00', isOpen: true },
        friday: { open: '09:00', close: '17:00', isOpen: true },
        saturday: { open: '10:00', close: '14:00', isOpen: true },
        sunday: { open: '', close: '', isOpen: false }
      }
    };

    const response = await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: profileData
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Provider profile updated successfully');
    expect(responseBody.provider.businessName).toBe(profileData.businessName);
    expect(responseBody.provider.businessDescription).toBe(profileData.businessDescription);
    expect(responseBody.provider.businessAddress).toBe(profileData.businessAddress);
    expect(responseBody.provider.businessPhone).toBe(profileData.businessPhone);
    expect(responseBody.provider.businessEmail).toBe(profileData.businessEmail);
    expect(responseBody.provider.website).toBe(profileData.website);
    expect(responseBody.provider.category._id).toBe(profileData.category);
  });

  test('should not update provider profile with invalid data', async ({ request }) => {
    const invalidData = {
      businessName: 'A', // Too short
      businessEmail: 'invalid-email', // Invalid email
      website: 'not-a-url' // Invalid URL
    };

    const response = await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('should get empty services list initially', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.services).toBeDefined();
    expect(Array.isArray(responseBody.services)).toBe(true);
    expect(responseBody.services.length).toBe(0);
  });

  test('should create a new service', async ({ request }) => {
    const serviceData = {
      name: 'Professional Consultation',
      description: 'Comprehensive professional consultation service with detailed analysis and recommendations',
      category: selectedCategoryId,
      price: 150.00,
      duration: 60,
      maxBookingsPerDay: 5,
      requirements: ['Valid ID', 'Prior appointment'],
      tags: ['consultation', 'professional', 'analysis']
    };

    const response = await request.post(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: serviceData
    });

    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Service created successfully');
    expect(responseBody.service.name).toBe(serviceData.name);
    expect(responseBody.service.description).toBe(serviceData.description);
    expect(responseBody.service.category._id).toBe(serviceData.category);
    expect(responseBody.service.price).toBe(serviceData.price);
    expect(responseBody.service.duration).toBe(serviceData.duration);
    expect(responseBody.service.maxBookingsPerDay).toBe(serviceData.maxBookingsPerDay);
    expect(responseBody.service.isActive).toBe(true);
    
    // Store service ID for later tests
    serviceId = responseBody.service._id;
  });

  test('should not create service with invalid data', async ({ request }) => {
    const invalidServiceData = {
      name: 'A', // Too short
      description: 'Short', // Too short
      category: 'invalid-category-id',
      price: -10, // Negative price
      duration: 0 // Invalid duration
    };

    const response = await request.post(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidServiceData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('should get services list with created service', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.services).toBeDefined();
    expect(Array.isArray(responseBody.services)).toBe(true);
    expect(responseBody.services.length).toBe(1);
    expect(responseBody.services[0].name).toBe('Professional Consultation');
  });

  test('should update existing service', async ({ request }) => {
    const updateData = {
      name: 'Updated Professional Consultation',
      description: 'Updated comprehensive professional consultation service with enhanced analysis',
      price: 175.00,
      duration: 90,
      maxBookingsPerDay: 3
    };

    const response = await request.put(`${BASE_URL}/api/provider/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: updateData
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Service updated successfully');
    expect(responseBody.service.name).toBe(updateData.name);
    expect(responseBody.service.description).toBe(updateData.description);
    expect(responseBody.service.price).toBe(updateData.price);
    expect(responseBody.service.duration).toBe(updateData.duration);
    expect(responseBody.service.maxBookingsPerDay).toBe(updateData.maxBookingsPerDay);
  });

  test('should not update service with invalid data', async ({ request }) => {
    const invalidUpdateData = {
      name: 'A', // Too short
      price: -50, // Negative price
      duration: 0 // Invalid duration
    };

    const response = await request.put(`${BASE_URL}/api/provider/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidUpdateData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Validation failed');
    expect(responseBody.details).toBeDefined();
  });

  test('should delete service', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/provider/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Service deleted successfully');
  });

  test('should have empty services list after deletion', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.services).toBeDefined();
    expect(Array.isArray(responseBody.services)).toBe(true);
    expect(responseBody.services.length).toBe(0);
  });

  test('should require authentication for provider endpoints', async ({ request }) => {
    const endpoints = [
      { method: 'GET', url: `${BASE_URL}/api/provider/profile` },
      { method: 'PUT', url: `${BASE_URL}/api/provider/profile` },
      { method: 'GET', url: `${BASE_URL}/api/provider/services` },
      { method: 'POST', url: `${BASE_URL}/api/provider/services` }
    ];

    for (const endpoint of endpoints) {
      const response = await request[endpoint.method.toLowerCase()](endpoint.url);
      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Access token required');
    }
  });

  test('should require provider role for provider endpoints', async ({ request }) => {
    // Create a client user
    const clientUser = {
      email: `client-${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Test Client',
      role: 'client'
    };

    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: clientUser
    });
    
    const registerData = await registerResponse.json();
    const clientToken = registerData.token;

    const endpoints = [
      { method: 'GET', url: `${BASE_URL}/api/provider/profile` },
      { method: 'PUT', url: `${BASE_URL}/api/provider/profile` },
      { method: 'GET', url: `${BASE_URL}/api/provider/services` },
      { method: 'POST', url: `${BASE_URL}/api/provider/services` }
    ];

    for (const endpoint of endpoints) {
      const response = await request[endpoint.method.toLowerCase()](endpoint.url, {
        headers: {
          'Authorization': `Bearer ${clientToken}`
        }
      });
      expect(response.status()).toBe(403);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Insufficient permissions');
    }
  });
});