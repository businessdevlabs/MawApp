import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Admin Functionality Tests', () => {
  let adminUser = {
    email: `admin-${Date.now()}@example.com`,
    password: 'adminpassword123',
    fullName: 'Test Admin User',
    role: 'admin',
    phone: '1111111111'
  };

  let testClient = {
    email: `client-${Date.now()}@example.com`,
    password: 'clientpassword123',
    fullName: 'Test Client User',
    role: 'client',
    phone: '2222222222'
  };

  let testProvider = {
    email: `provider-${Date.now()}@example.com`,
    password: 'providerpassword123',
    fullName: 'Test Provider User',
    role: 'provider',
    phone: '3333333333'
  };

  let adminAuthToken = '';
  let clientUserId = '';
  let providerUserId = '';
  let providerId = '';
  let selectedCategoryId = '';

  test.beforeAll(async ({ request }) => {
    console.log('Setting up admin functionality tests...');

    // Step 1: Register admin user
    console.log('Registering admin user:', adminUser.email);
    const adminRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: adminUser
    });
    expect(adminRegisterResponse.status()).toBe(201);
    const adminData = await adminRegisterResponse.json();
    adminAuthToken = adminData.token;
    console.log('Admin user registered successfully');

    // Step 2: Register test client
    console.log('Registering test client:', testClient.email);
    const clientRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testClient
    });
    expect(clientRegisterResponse.status()).toBe(201);
    const clientData = await clientRegisterResponse.json();
    clientUserId = clientData.user._id;
    console.log('Test client registered with ID:', clientUserId);

    // Step 3: Register test provider
    console.log('Registering test provider:', testProvider.email);
    const providerRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: testProvider
    });
    expect(providerRegisterResponse.status()).toBe(201);
    const providerData = await providerRegisterResponse.json();
    providerUserId = providerData.user._id;
    console.log('Test provider registered with ID:', providerUserId);

    // Step 4: Get categories for provider setup
    const categoriesResponse = await request.get(`${BASE_URL}/api/categories`);
    expect(categoriesResponse.status()).toBe(200);
    const categoriesData = await categoriesResponse.json();
    selectedCategoryId = categoriesData.categories[0]._id;
    console.log('Using category ID:', selectedCategoryId);

    // Step 5: Create provider profile (this will create a ServiceProvider record)
    const providerToken = providerData.token;
    const profileData = {
      businessName: 'Test Admin Business',
      businessDescription: 'A test business for admin testing',
      businessAddress: '456 Admin Street, Admin City',
      businessPhone: '+1-555-ADMIN',
      businessEmail: 'business@admintest.com',
      category: selectedCategoryId
    };

    const profileResponse = await request.put(`${BASE_URL}/api/provider/profile`, {
      headers: { 'Authorization': `Bearer ${providerToken}` },
      data: profileData
    });
    expect(profileResponse.status()).toBe(200);
    const profileResponseData = await profileResponse.json();
    providerId = profileResponseData.provider._id;
    console.log('Provider profile created with ID:', providerId);

    console.log('Setup completed successfully');
  });

  test('should access admin dashboard with statistics', async ({ request }) => {
    console.log('Testing admin dashboard access...');

    // Test admin stats endpoint
    const statsResponse = await request.get(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(statsResponse.status()).toBe(200);
    const statsData = await statsResponse.json();

    console.log('Admin stats response:', JSON.stringify(statsData, null, 2));

    // Verify stats structure
    expect(statsData).toHaveProperty('totalClients');
    expect(statsData).toHaveProperty('totalProviders');
    expect(statsData).toHaveProperty('pendingProviders');
    expect(statsData).toHaveProperty('approvedProviders');
    expect(statsData).toHaveProperty('totalBookings');
    expect(statsData).toHaveProperty('totalRevenue');

    // Should have at least our test data
    expect(statsData.totalClients).toBeGreaterThanOrEqual(1);
    expect(statsData.totalProviders).toBeGreaterThanOrEqual(1);
    expect(statsData.pendingProviders).toBeGreaterThanOrEqual(1); // Our test provider should be pending

    console.log('✅ Admin dashboard statistics working correctly');
  });

  test('should fetch and manage users through admin API', async ({ request }) => {
    console.log('Testing admin user management...');

    // Test fetching all users
    const usersResponse = await request.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(usersResponse.status()).toBe(200);
    const usersData = await usersResponse.json();

    console.log('Users response structure:', {
      totalUsers: usersData.pagination?.totalUsers,
      usersCount: usersData.users?.length,
      sampleUser: usersData.users?.[0] ? {
        id: usersData.users[0]._id,
        email: usersData.users[0].email,
        role: usersData.users[0].role
      } : null
    });

    // Verify response structure
    expect(usersData).toHaveProperty('users');
    expect(usersData).toHaveProperty('pagination');
    expect(Array.isArray(usersData.users)).toBe(true);
    expect(usersData.users.length).toBeGreaterThanOrEqual(3); // admin, client, provider

    // Find our test users
    const foundClient = usersData.users.find(u => u._id === clientUserId);
    const foundProvider = usersData.users.find(u => u._id === providerUserId);

    expect(foundClient).toBeDefined();
    expect(foundProvider).toBeDefined();
    expect(foundClient.role).toBe('client');
    expect(foundProvider.role).toBe('provider');

    console.log('✅ Admin user fetching working correctly');
  });

  test('should change user role from client to provider', async ({ request }) => {
    console.log('Testing user role change functionality...');

    // Change client to provider role
    const roleChangeResponse = await request.put(`${BASE_URL}/api/admin/users/${clientUserId}/role`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { role: 'provider' }
    });

    expect(roleChangeResponse.status()).toBe(200);
    const roleChangeData = await roleChangeResponse.json();

    console.log('Role change response:', JSON.stringify(roleChangeData, null, 2));

    expect(roleChangeData.message).toBe('User role updated successfully');
    expect(roleChangeData.user._id).toBe(clientUserId);
    expect(roleChangeData.user.role).toBe('provider');

    // Verify the change by fetching the user again
    const usersResponse = await request.get(`${BASE_URL}/api/admin/users?search=${testClient.email}`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(usersResponse.status()).toBe(200);
    const usersData = await usersResponse.json();
    const updatedUser = usersData.users.find(u => u._id === clientUserId);

    expect(updatedUser.role).toBe('provider');

    console.log('✅ User role change working correctly');

    // Change back to client for consistency
    await request.put(`${BASE_URL}/api/admin/users/${clientUserId}/role`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { role: 'client' }
    });
  });

  test('should fetch and manage providers through admin API', async ({ request }) => {
    console.log('Testing admin provider management...');

    // Test fetching all providers
    const providersResponse = await request.get(`${BASE_URL}/api/admin/providers`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(providersResponse.status()).toBe(200);
    const providersData = await providersResponse.json();

    console.log('Providers response structure:', {
      totalProviders: providersData.pagination?.totalProviders,
      providersCount: providersData.providers?.length,
      sampleProvider: providersData.providers?.[0] ? {
        id: providersData.providers[0]._id,
        businessName: providersData.providers[0].businessName,
        status: providersData.providers[0].status
      } : null
    });

    // Verify response structure
    expect(providersData).toHaveProperty('providers');
    expect(providersData).toHaveProperty('pagination');
    expect(Array.isArray(providersData.providers)).toBe(true);
    expect(providersData.providers.length).toBeGreaterThanOrEqual(1);

    // Find our test provider
    const foundProvider = providersData.providers.find(p => p._id === providerId);
    expect(foundProvider).toBeDefined();
    expect(foundProvider.status).toBe('pending');
    expect(foundProvider.businessName).toBe('Test Admin Business');

    console.log('✅ Admin provider fetching working correctly');
  });

  test('should approve provider application', async ({ request }) => {
    console.log('Testing provider status management...');

    // Approve the provider
    const statusUpdateResponse = await request.put(`${BASE_URL}/api/admin/providers/${providerId}/status`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { 
        status: 'approved',
        reason: 'Test approval by admin'
      }
    });

    expect(statusUpdateResponse.status()).toBe(200);
    const statusUpdateData = await statusUpdateResponse.json();

    console.log('Provider status update response:', JSON.stringify(statusUpdateData, null, 2));

    expect(statusUpdateData.message).toBe('Provider status updated successfully');
    expect(statusUpdateData.provider._id).toBe(providerId);
    expect(statusUpdateData.provider.status).toBe('approved');
    expect(statusUpdateData.provider.statusReason).toBe('Test approval by admin');

    // Verify the status change by fetching provider again
    const providersResponse = await request.get(`${BASE_URL}/api/admin/providers?status=approved`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(providersResponse.status()).toBe(200);
    const providersData = await providersResponse.json();
    const approvedProvider = providersData.providers.find(p => p._id === providerId);

    expect(approvedProvider).toBeDefined();
    expect(approvedProvider.status).toBe('approved');

    console.log('✅ Provider approval working correctly');
  });

  test('should suspend and unsuspend user', async ({ request }) => {
    console.log('Testing user suspension functionality...');

    // Suspend the client user
    const suspendResponse = await request.put(`${BASE_URL}/api/admin/users/${clientUserId}/suspend`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { 
        suspended: true,
        reason: 'Test suspension by admin'
      }
    });

    expect(suspendResponse.status()).toBe(200);
    const suspendData = await suspendResponse.json();

    console.log('User suspension response:', JSON.stringify(suspendData, null, 2));

    expect(suspendData.message).toBe('User suspended successfully');
    expect(suspendData.user._id).toBe(clientUserId);
    expect(suspendData.user.suspended).toBe(true);
    expect(suspendData.user.suspensionReason).toBe('Test suspension by admin');

    // Verify suspension by fetching user
    const usersResponse = await request.get(`${BASE_URL}/api/admin/users?search=${testClient.email}`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(usersResponse.status()).toBe(200);
    const usersData = await usersResponse.json();
    const suspendedUser = usersData.users.find(u => u._id === clientUserId);

    expect(suspendedUser.suspended).toBe(true);

    // Unsuspend the user
    const unsuspendResponse = await request.put(`${BASE_URL}/api/admin/users/${clientUserId}/suspend`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { 
        suspended: false,
        reason: 'Test unsuspension by admin'
      }
    });

    expect(unsuspendResponse.status()).toBe(200);
    const unsuspendData = await unsuspendResponse.json();

    expect(unsuspendData.message).toBe('User unsuspended successfully');
    expect(unsuspendData.user.suspended).toBe(false);

    console.log('✅ User suspension/unsuspension working correctly');
  });

  test('should fetch recent bookings for admin dashboard', async ({ request }) => {
    console.log('Testing admin recent bookings...');

    const recentBookingsResponse = await request.get(`${BASE_URL}/api/admin/bookings/recent?limit=10`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(recentBookingsResponse.status()).toBe(200);
    const recentBookingsData = await recentBookingsResponse.json();

    console.log('Recent bookings response:', {
      bookingsCount: recentBookingsData.bookings?.length || 0,
      hasBookings: Array.isArray(recentBookingsData.bookings)
    });

    expect(recentBookingsData).toHaveProperty('bookings');
    expect(Array.isArray(recentBookingsData.bookings)).toBe(true);

    console.log('✅ Admin recent bookings endpoint working correctly');
  });

  test('should handle analytics endpoint', async ({ request }) => {
    console.log('Testing admin analytics...');

    const analyticsResponse = await request.get(`${BASE_URL}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(analyticsResponse.status()).toBe(200);
    const analyticsData = await analyticsResponse.json();

    console.log('Analytics response structure:', Object.keys(analyticsData));

    expect(analyticsData).toHaveProperty('bookingsByStatus');
    expect(analyticsData).toHaveProperty('monthlyRevenue');
    expect(analyticsData).toHaveProperty('topServices');

    expect(Array.isArray(analyticsData.bookingsByStatus)).toBe(true);
    expect(Array.isArray(analyticsData.monthlyRevenue)).toBe(true);
    expect(Array.isArray(analyticsData.topServices)).toBe(true);

    console.log('✅ Admin analytics endpoint working correctly');
  });

  test('should prevent non-admin users from accessing admin endpoints', async ({ request }) => {
    console.log('Testing admin access control...');

    // Register a regular client user
    const regularUser = {
      email: `regular-${Date.now()}@example.com`,
      password: 'regularpassword123',
      fullName: 'Regular User',
      role: 'client'
    };

    const regularRegisterResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: regularUser
    });
    expect(regularRegisterResponse.status()).toBe(201);
    const regularData = await regularRegisterResponse.json();
    const regularToken = regularData.token;

    // Try to access admin endpoints with regular user token
    const adminEndpoints = [
      '/api/admin/stats',
      '/api/admin/users',
      '/api/admin/providers'
    ];

    for (const endpoint of adminEndpoints) {
      const unauthorizedResponse = await request.get(`${BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${regularToken}` }
      });

      expect(unauthorizedResponse.status()).toBe(403);
      const errorData = await unauthorizedResponse.json();
      expect(errorData.error).toBe('Insufficient permissions');

      console.log(`✅ Endpoint ${endpoint} correctly blocked for non-admin user`);
    }

    console.log('✅ Admin access control working correctly');
  });

  test('should prevent admin from modifying their own account dangerously', async ({ request }) => {
    console.log('Testing admin self-modification protection...');

    // Get admin user ID first
    const usersResponse = await request.get(`${BASE_URL}/api/admin/users?search=${adminUser.email}`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(usersResponse.status()).toBe(200);
    const usersData = await usersResponse.json();
    const adminUserData = usersData.users.find(u => u.email === adminUser.email);
    const adminUserId = adminUserData._id;

    // Try to suspend themselves - should fail
    const selfSuspendResponse = await request.put(`${BASE_URL}/api/admin/users/${adminUserId}/suspend`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { 
        suspended: true,
        reason: 'Self suspension test'
      }
    });

    expect(selfSuspendResponse.status()).toBe(400);
    const suspendErrorData = await selfSuspendResponse.json();
    expect(suspendErrorData.error).toBe('Cannot suspend your own account');

    // Try to delete themselves - should fail
    const selfDeleteResponse = await request.delete(`${BASE_URL}/api/admin/users/${adminUserId}`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` },
      data: { reason: 'Self deletion test' }
    });

    expect(selfDeleteResponse.status()).toBe(400);
    const deleteErrorData = await selfDeleteResponse.json();
    expect(deleteErrorData.error).toBe('Cannot delete your own account');

    console.log('✅ Admin self-modification protection working correctly');
  });

  test('should search and filter users correctly', async ({ request }) => {
    console.log('Testing user search and filtering...');

    // Test search by email
    const emailSearchResponse = await request.get(`${BASE_URL}/api/admin/users?search=${testClient.email}`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(emailSearchResponse.status()).toBe(200);
    const emailSearchData = await emailSearchResponse.json();
    expect(emailSearchData.users.length).toBeGreaterThanOrEqual(1);
    const foundUser = emailSearchData.users.find(u => u.email === testClient.email);
    expect(foundUser).toBeDefined();

    // Test search by name
    const nameSearchResponse = await request.get(`${BASE_URL}/api/admin/users?search=Test Client`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(nameSearchResponse.status()).toBe(200);
    const nameSearchData = await nameSearchResponse.json();
    expect(nameSearchData.users.length).toBeGreaterThanOrEqual(1);

    // Test role filtering
    const roleFilterResponse = await request.get(`${BASE_URL}/api/admin/users?role=client`, {
      headers: { 'Authorization': `Bearer ${adminAuthToken}` }
    });

    expect(roleFilterResponse.status()).toBe(200);
    const roleFilterData = await roleFilterResponse.json();
    expect(roleFilterData.users.every(u => u.role === 'client')).toBe(true);

    console.log('✅ User search and filtering working correctly');
  });
});