// Test setup file for mocking MongoDB and other dependencies
import { beforeAll, afterAll } from '@playwright/test';

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/appoint-zenith-test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  // You could start a test MongoDB instance here if needed
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  // Cleanup test database if needed
});