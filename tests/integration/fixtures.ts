import { QueryFunction } from '../../lib/db/types';
import { User, CreateUser } from '../../lib/models/User';
import { Journal } from '../../lib/models/Journal';
import { ReferenceTask, CreateReferenceTask } from '../../lib/models/ReferenceTask';
import { createUserRepository } from '../../lib/repositories/userRepository';
import { createJournalRepository } from '../../lib/repositories/journalRepository';
import { createTaskRepository } from '../../lib/repositories/taskRepository';

export class TestFixtures {
  private userRepository;
  private journalRepository;
  private taskRepository;

  constructor(private query: QueryFunction) {
    this.userRepository = createUserRepository(query);
    this.journalRepository = createJournalRepository(query);
    this.taskRepository = createTaskRepository(query);
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

    return await this.userRepository.create(userData);
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

  async createTestReferenceTask(
    userId: number,
    journalId: string,
    overrides: Partial<Omit<CreateReferenceTask, 'user_id' | 'journal_id'>> = {}
  ): Promise<ReferenceTask> {
    const today = new Date();
    const referenceTaskData: CreateReferenceTask = {
      user_id: userId,
      journal_id: journalId,
      title: overrides.title || `Test Reference Task ${Date.now()}`,
      description: overrides.description || 'A test reference task',
      recurrence_type: overrides.recurrence_type || 'daily',
      recurrence_interval: overrides.recurrence_interval || 1,
      recurrence_days_of_week: overrides.recurrence_days_of_week ?? undefined,
      recurrence_day_of_month: overrides.recurrence_day_of_month ?? undefined,
      recurrence_week_of_month: overrides.recurrence_week_of_month ?? undefined,
      starts_on: overrides.starts_on || today,
      ends_on: overrides.ends_on ?? undefined,
      is_active: overrides.is_active !== false, // Default to true
    };

    return await this.taskRepository.upsertReferenceTask(referenceTaskData);
  }
}
