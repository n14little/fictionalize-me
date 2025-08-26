import { QueryFunction } from '../../lib/db/types';
import { User, CreateUser } from '../../lib/models/User';
import { Journal } from '../../lib/models/Journal';
import {
  Task,
  CreateTask,
  BUCKET_TO_RECURRENCE_TYPE,
} from '../../lib/models/Task';
import {
  ReferenceTask,
  CreateReferenceTask,
} from '../../lib/models/ReferenceTask';
import {
  WaitlistEntry,
  CreateWaitlistEntry,
} from '../../lib/models/WaitlistEntry';
import { createUserRepository } from '../../lib/repositories/userRepository';
import { createJournalRepository } from '../../lib/repositories/journalRepository';
import { createTaskRepository } from '../../lib/repositories/taskRepository';
import { createWaitlistRepository } from '../../lib/repositories/waitlistRepository';

export class TestFixtures {
  private userRepository;
  private journalRepository;
  private taskRepository;
  private waitlistRepository;

  constructor(private query: QueryFunction) {
    this.userRepository = createUserRepository(query);
    this.journalRepository = createJournalRepository(query);
    this.taskRepository = createTaskRepository(query);
    this.waitlistRepository = createWaitlistRepository(query);
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
      recurrence_type:
        overrides.recurrence_type || BUCKET_TO_RECURRENCE_TYPE.daily,
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

  /**
   * Update the next_scheduled_date for a reference task to a specific date
   * This is useful for testing scenarios where we need specific scheduling dates
   */
  async updateReferenceTaskNextScheduledDate(
    referenceTaskId: string,
    nextScheduledDate: Date
  ): Promise<void> {
    await this.query(
      'UPDATE reference_tasks SET next_scheduled_date = $1 WHERE id = $2',
      [nextScheduledDate, referenceTaskId]
    );
  }

  async createTestTask(
    userId: number,
    journalId: string,
    overrides: Partial<Omit<CreateTask, 'user_id' | 'journal_id'>> = {}
  ): Promise<Task> {
    // If reference_task_id is provided, fetch the recurrence_type
    let recurrenceType: number | undefined;
    if (overrides.reference_task_id) {
      const refTask = await this.taskRepository.findReferenceTaskById(
        overrides.reference_task_id
      );
      recurrenceType = refTask?.recurrence_type;
    }

    const taskData: CreateTask = {
      user_id: userId,
      journal_id: journalId,
      title: overrides.title || `Test Task ${Date.now()}`,
      description: overrides.description || 'A test task',
      priority: overrides.priority || '0|000001',
      reference_task_id: overrides.reference_task_id ?? undefined,
      recurrence_type: overrides.recurrence_type ?? recurrenceType ?? undefined,
      scheduled_date: overrides.scheduled_date ?? undefined,
      parent_task_id: overrides.parent_task_id ?? undefined,
    };

    // Use the create method from the task repository
    return await this.taskRepository.create(taskData);
  }

  async createTestWaitlistEntry(
    overrides: Partial<CreateWaitlistEntry> = {}
  ): Promise<WaitlistEntry> {
    const waitlistData: CreateWaitlistEntry = {
      email:
        overrides.email ||
        `testuser${Date.now()}-${Math.random().toString(36).substring(2, 11)}@example.com`,
      interest: overrides.interest || 'Testing the application',
    };

    return await this.waitlistRepository.create(waitlistData);
  }

  /**
   * Mark a task as missed (test-only helper)
   * @param taskId - The ID of the task to mark as missed
   * @param missedDate - Optional specific date, defaults to yesterday
   */
  async markTaskAsMissed(taskId: string, missedDate?: Date): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await this.query('UPDATE tasks SET missed_at = $1 WHERE id = $2', [
      missedDate || yesterday,
      taskId,
    ]);
  }
}
