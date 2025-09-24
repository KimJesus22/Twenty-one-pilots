// Global teardown for Playwright E2E tests

module.exports = async (config) => {
  // Cleanup code that runs after all tests
  console.log('🧹 Cleaning up E2E test environment...');

  // You can add global cleanup logic here
  // For example: cleaning up test data, closing connections, etc.

  console.log('✅ E2E test environment cleanup complete');
};