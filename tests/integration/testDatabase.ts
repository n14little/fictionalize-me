import { Pool } from 'pg';
import { QueryFunction } from '../../lib/db/types';

export class TestDatabase {
  private pool: Pool;
  private static instance: TestDatabase;

  private constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      ssl: false, // Usually no SSL for test databases
      max: 10, // Higher connection pool for tests
    });
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  getQueryFunction(): QueryFunction {
    return async (text: string, params?: unknown[]) => {
      try {
        const result = await this.pool.query(text, params);
        return result;
      } catch (error) {
        console.error('Test query error', { text, error });
        throw error;
      }
    };
  }

  async cleanup(): Promise<void> {
    // Clean up test data - be very careful here!
    // Only clean up test-related data or use a separate test database
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Cleanup should only be run in test environment');
    }

    const query = this.getQueryFunction();

    // Use a transaction to ensure atomic cleanup
    await query('BEGIN');
    try {
      // Clean up in reverse dependency order
      await query('DELETE FROM journal_entries WHERE 1=1');
      await query('DELETE FROM journal_streaks WHERE 1=1');
      await query('DELETE FROM tasks WHERE 1=1');
      await query('DELETE FROM reference_tasks WHERE 1=1');
      await query('DELETE FROM journals WHERE 1=1');
      await query(
        "DELETE FROM users WHERE email LIKE 'testuser%@example.com' OR external_user_id LIKE 'test_%'"
      );
      await query('DELETE FROM waitlist_entries WHERE 1=1');
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
