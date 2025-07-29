// Integration test setup
// Set timezone to UTC for consistent date testing
process.env.TZ = 'UTC';

// Ensure we have a database URL for integration tests
if (!process.env.DATABASE_URL) {
  console.warn('[WARN] DATABASE_URL must be set for integration tests');
  console.warn(
    '[WARN] Using default DATABASE_URL for tests: postgres://postgres:postgres@localhost:5432/fictionalize_me'
  );
  process.env.DATABASE_URL =
    'postgres://postgres:postgres@localhost:5432/fictionalize_me';
}

console.log('🔧 Setting up integration test environment');
console.log(`Database: ${process.env.DATABASE_URL}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
