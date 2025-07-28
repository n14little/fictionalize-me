// Integration test setup
// Set timezone to UTC for consistent date testing
process.env.TZ = 'UTC';

// Ensure we have a test database URL
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL or DATABASE_URL must be set for integration tests'
  );
}

console.log('🔧 Setting up integration test environment');
console.log(
  `Database: ${process.env.TEST_DATABASE_URL || process.env.DATABASE_URL}`
);
console.log(`Environment: ${process.env.NODE_ENV}`);
