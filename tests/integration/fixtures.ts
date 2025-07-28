import { QueryFunction } from '../../lib/db/types';
import { User } from '../../lib/models/User';
import { Journal } from '../../lib/models/Journal';

export class TestFixtures {
  constructor(private query: QueryFunction) {}

  async createTestUser(overrides: Partial<User> = {}): Promise<User> {
    const userData = {
      email: overrides.email || `testuser${Date.now()}@example.com`,
      external_user_id: overrides.external_user_id || `test_${Date.now()}`,
      ...overrides,
    };

    const result = await this.query(
      'INSERT INTO users (email, external_user_id) VALUES ($1, $2) RETURNING *',
      [userData.email, userData.external_user_id]
    );

    return result.rows[0] as User;
  }

  async createTestJournal(
    userId: number,
    overrides: Partial<Journal> = {}
  ): Promise<Journal> {
    const journalData = {
      user_id: userId,
      title: overrides.title || `Test Journal ${Date.now()}`,
      description: overrides.description || 'A test journal',
      public: overrides.public || false,
      ...overrides,
    };

    const result = await this.query(
      'INSERT INTO journals (user_id, title, description, public) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        journalData.user_id,
        journalData.title,
        journalData.description,
        journalData.public,
      ]
    );

    return result.rows[0] as Journal;
  }
}
