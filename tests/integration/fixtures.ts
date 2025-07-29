import { QueryFunction } from '../../lib/db/types';
import { User, CreateUser } from '../../lib/models/User';
import { Journal } from '../../lib/models/Journal';
import { userRepository } from '../../lib/repositories/userRepository';
import { createJournalRepository } from '../../lib/repositories/journalRepository';

export class TestFixtures {
  private journalRepository;

  constructor(private query: QueryFunction) {
    this.journalRepository = createJournalRepository(query);
  }

  async createTestUser(overrides: Partial<CreateUser> = {}): Promise<User> {
    const userData: CreateUser = {
      email:
        overrides.email ||
        `testuser${Date.now()}-${Math.random().toString(36).substring(2, 11)}@example.com`,
      external_user_id:
        overrides.external_user_id ||
        `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    return await userRepository.create(userData);
  }

  async createTestJournal(
    userId: number,
    overrides: Partial<
      Omit<Journal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    > = {}
  ): Promise<Journal> {
    const journalData = {
      title: overrides.title || `Test Journal ${Date.now()}`,
      description: overrides.description || 'A test journal',
      public: overrides.public || false,
    };

    return await this.journalRepository.create({
      user_id: userId,
      ...journalData,
    });
  }
}
