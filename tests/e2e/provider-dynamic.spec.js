import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Dynamic Provider API Tests', () => {
  let providerUser = {
    email: `provider-dynamic-${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Dynamic Test Provider',
    role: 'provider',
    phone: '1234567890'
  };
  
  let authToken = '';
  let availableCategories = [];
  let selectedCategoryId = '';
  let serviceId = '';

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
    expect(availableCategories.length).toBeGreaterThan(0);
    
    // Select first category for testing
    selectedCategoryId = availableCategories[0]._id;
  });

  test('should get available service categories', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/categories`);

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.categories).toBeDefined();
    expect(Array.isArray(responseBody.categories)).toBe(true);
    expect(responseBody.categories.length).toBeGreaterThan(0);
    
    // Check category structure
    const category = responseBody.categories[0];
    expect(category.name).toBeDefined();
    expect(category.description).toBeDefined();
    expect(category.isActive).toBe(true);
  });

  test('should get category details with common services', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/categories/${selectedCategoryId}`);

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.category).toBeDefined();
    expect(responseBody.category._id).toBe(selectedCategoryId);
    expect(responseBody.category.name).toBeDefined();
    expect(responseBody.category.commonServices).toBeDefined();
    expect(Array.isArray(responseBody.category.commonServices)).toBe(true);
  });

  test('should get common services for a category', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/categories/${selectedCategoryId}/services`);

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.categoryName).toBeDefined();
    expect(responseBody.commonServices).toBeDefined();
    expect(Array.isArray(responseBody.commonServices)).toBe(true);
    
    if (responseBody.commonServices.length > 0) {
      const service = responseBody.commonServices[0];
      expect(service.name).toBeDefined();
      expect(service.description).toBeDefined();
      expect(service.averagePrice).toBeDefined();
      expect(service.averageDuration).toBeDefined();
    }
  });

  test('should update provider profile with dynamic category', async ({ request }) => {
    const profileData = {
      businessName: 'Dynamic Business Name',
      businessDescription: 'A business using dynamic categories',
      businessAddress: '123 Dynamic Street, Test City, TC 12345',
      businessPhone: '+1-555-0123',
      businessEmail: 'dynamic@test.com',
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
    expect(responseBody.provider.category._id).toBe(selectedCategoryId);
    expect(responseBody.provider.category.name).toBeDefined();
  });

  test('should reject invalid category ID in profile update', async ({ request }) => {
    const invalidData = {
      businessName: 'Test Business',
      category: '507f1f77bcf86cd799439011' // Invalid ObjectId
    };

    const response = await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid category selected');
  });

  test('should create service with dynamic category', async ({ request }) => {
    const serviceData = {
      name: 'Dynamic Service',
      description: 'A service created with dynamic category selection for comprehensive testing',
      category: selectedCategoryId,
      price: 125.00,
      duration: 75,
      maxBookingsPerDay: 4,
      requirements: ['Valid ID', 'Prior consultation'],
      tags: ['dynamic', 'professional', 'consultation']
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
    expect(responseBody.service.category._id).toBe(selectedCategoryId);
    expect(responseBody.service.category.name).toBeDefined();
    
    serviceId = responseBody.service._id;
  });

  test('should reject service creation with invalid category', async ({ request }) => {
    const invalidServiceData = {
      name: 'Invalid Service',
      description: 'Service with invalid category for testing validation',
      category: '507f1f77bcf86cd799439011', // Invalid ObjectId
      price: 100,
      duration: 60
    };

    const response = await request.post(`${BASE_URL}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidServiceData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid category selected');
  });

  test('should get services with populated categories', async ({ request }) => {
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
    
    const service = responseBody.services[0];
    expect(service.category).toBeDefined();
    expect(service.category._id).toBe(selectedCategoryId);
    expect(service.category.name).toBeDefined();
  });

  test('should update service with different category', async ({ request }) => {
    // Select a different category for update
    const differentCategoryId = availableCategories[1]._id;
    
    const updateData = {
      name: 'Updated Dynamic Service',
      category: differentCategoryId,
      price: 150.00
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
    expect(responseBody.service.category._id).toBe(differentCategoryId);
    expect(responseBody.service.category.name).toBeDefined();
    expect(responseBody.service.price).toBe(updateData.price);
  });

  test('should reject service update with invalid category', async ({ request }) => {
    const invalidUpdateData = {
      category: '507f1f77bcf86cd799439011' // Invalid ObjectId
    };

    const response = await request.put(`${BASE_URL}/api/provider/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: invalidUpdateData
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid category selected');
  });

  test('should handle non-existent category gracefully', async ({ request }) => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    
    const response = await request.get(`${BASE_URL}/api/categories/${nonExistentId}`);

    expect(response.status()).toBe(404);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Category not found');
  });

  test('should clean up test service', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/provider/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('Service deleted successfully');
  });
});