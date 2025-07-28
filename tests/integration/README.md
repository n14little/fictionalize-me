# Integration Testing Setup

This directory contains integration tests that test the service layer through to the database. These tests verify that our backend services work correctly with real database operations.

## Architecture

The integration testing setup uses dependency injection to make services testable:

### Key Components

1. **QueryFunction Type** (`lib/db/types.ts`) - Defines the database query interface
2. **Repository Factories** - Factory functions co-located with repositories (e.g., `createJournalRepository` in `lib/repositories/journalRepository.ts`)
3. **Service Factories** - Factory functions co-located with services (e.g., `createJournalService` in `lib/services/journalService.ts`)
4. **TestDatabase** (`tests/integration/testDatabase.ts`) - Manages test database connections and cleanup
5. **TestFixtures** (`tests/integration/fixtures.ts`) - Helper functions to create test data

### Benefits

- **Co-located Code**: Factory functions live alongside their implementations for easy maintenance
- **Isolated Testing**: Each test runs with a clean database state
- **Real Database Operations**: Tests verify actual SQL queries and database interactions
- **Service Layer Focus**: Tests the business logic in services without UI complexity
- **Dependency Injection**: Makes the code more testable and flexible

## Running Tests

```bash
# Start the database
npm run db:start

# Run migrations
npm run db:migrate

# Run integration tests
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fictionalize_me" npm run test:integration

# Run in watch mode
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fictionalize_me" npm run test:integration:watch
```

## Test Structure

Each integration test follows this pattern:

```typescript
describe('ServiceName - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let service: ReturnType<typeof createServiceFactory>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    service = createServiceFactory(query);

    // Clean up before each test
    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('should do something', async () => {
    // Arrange - Create test data
    const user = await fixtures.createTestUser();

    // Act - Call the service method
    const result = await service.someMethod(user.id, data);

    // Assert - Verify the result
    expect(result).toBeDefined();
  });
});
```

## Safety Considerations

⚠️ **Important**: These tests use a real database connection and perform actual database operations.

- Tests should **never run against production data**
- The `TestDatabase.cleanup()` method only runs in `NODE_ENV=test`
- Consider using a separate test database for additional safety
- All test data uses recognizable patterns (e.g., emails ending in `@example.com`)

## Adding New Tests

1. Add a factory function to your repository file (e.g., `createYourRepository(query: QueryFunction)`)
2. Add a factory function to your service file (e.g., `createYourService(query: QueryFunction)`)
3. Update the default service export to use the factory
4. Create a new test file in `tests/integration/`
5. Add test data creation methods to `TestFixtures` if needed

Example repository structure:

```typescript
// lib/repositories/yourRepository.ts
export const createYourRepository = (query: QueryFunction) => ({
  // ... repository methods
});

// Default instance
export const yourRepository = createYourRepository(query);
```

Example service structure:

```typescript
// lib/services/yourService.ts
export const createYourService = (query: QueryFunction) => {
  const yourRepository = createYourRepository(query);
  return {
    // ... service methods
  };
};

// Default instance
export const yourService = createYourService(query);
```

## Separation from Other Tests

These integration tests are completely separate from:

- **Unit Tests** (`tests/unit/`) - Fast, isolated tests with mocks
- **E2E Tests** (`tests/e2e/`) - Full browser-based tests with Playwright

Each test type serves a different purpose and runs independently.
