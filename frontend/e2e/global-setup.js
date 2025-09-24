// Global setup for Playwright E2E tests
const { chromium } = require('@playwright/test');

module.exports = async (config) => {
  // Setup code that runs before all tests
  console.log('🚀 Setting up E2E test environment...');

  // You can add global setup logic here
  // For example: seeding database, setting up test users, etc.

  console.log('✅ E2E test environment setup complete');
};