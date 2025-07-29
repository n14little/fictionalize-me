import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createReferenceTaskService } from '../../lib/services/referenceTaskService';
import { RecurrenceType } from '../../lib/models/ReferenceTask';

describe.sequential('ReferenceTaskService - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let referenceTaskService: ReturnType<typeof createReferenceTaskService>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    referenceTaskService = createReferenceTaskService(query);

    // Clean up before each test
    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('createReferenceTask', () => {
    it('should create a daily reference task', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const referenceTaskData = {
        journal_id: testJournal.id,
        title: 'Daily Exercise',
        description: 'Go for a 30 minute walk',
        recurrence_type: 'daily' as RecurrenceType,
        recurrence_interval: 1,
        starts_on: new Date('2024-01-01'),
      };

      // Act
      const createdTask = await referenceTaskService.createReferenceTask(
        testUser.id,
        referenceTaskData
      );

      // Assert
      expect(createdTask).toBeDefined();
      expect(createdTask.id).toBeDefined();
      expect(createdTask.user_id).toBe(testUser.id);
      expect(createdTask.journal_id).toBe(testJournal.id);
      expect(createdTask.title).toBe(referenceTaskData.title);
      expect(createdTask.description).toBe(referenceTaskData.description);
      expect(createdTask.recurrence_type).toBe(
        referenceTaskData.recurrence_type
      );
      expect(createdTask.recurrence_interval).toBe(
        referenceTaskData.recurrence_interval
      );
      expect(createdTask.starts_on).toEqual(referenceTaskData.starts_on);
      expect(createdTask.is_active).toBe(true);
      expect(createdTask.next_scheduled_date).toBeDefined();
      expect(createdTask.created_at).toBeDefined();
      expect(createdTask.updated_at).toBeDefined();
    });

    it('should create a weekly reference task for specific days', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const referenceTaskData = {
        journal_id: testJournal.id,
        title: 'Weekly Team Meeting',
        description: 'Attend the weekly team standup',
        recurrence_type: 'weekly' as RecurrenceType,
        recurrence_interval: 1,
        recurrence_days_of_week: [1, 3, 5], // Mon, Wed, Fri
        starts_on: new Date('2024-01-01'),
      };

      // Act
      const createdTask = await referenceTaskService.createReferenceTask(
        testUser.id,
        referenceTaskData
      );

      // Assert
      expect(createdTask).toBeDefined();
      expect(createdTask.recurrence_type).toBe('weekly');
      expect(createdTask.recurrence_days_of_week).toEqual([1, 3, 5]);
      expect(createdTask.recurrence_interval).toBe(1);
    });

    it('should create a monthly reference task on specific day of month', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const referenceTaskData = {
        journal_id: testJournal.id,
        title: 'Monthly Budget Review',
        description: 'Review and update monthly budget',
        recurrence_type: 'monthly' as RecurrenceType,
        recurrence_interval: 1,
        recurrence_day_of_month: 15,
        starts_on: new Date('2024-01-01'),
        ends_on: new Date('2024-12-31'),
      };

      // Act
      const createdTask = await referenceTaskService.createReferenceTask(
        testUser.id,
        referenceTaskData
      );

      // Assert
      expect(createdTask).toBeDefined();
      expect(createdTask.recurrence_type).toBe('monthly');
      expect(createdTask.recurrence_day_of_month).toBe(15);
      expect(createdTask.ends_on).toEqual(referenceTaskData.ends_on);
    });

    it('should create an inactive reference task', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const referenceTaskData = {
        journal_id: testJournal.id,
        title: 'Inactive Task',
        description: 'This task is inactive',
        recurrence_type: 'daily' as RecurrenceType,
        recurrence_interval: 1,
        starts_on: new Date('2024-01-01'),
        is_active: false,
      };

      // Act
      const createdTask = await referenceTaskService.createReferenceTask(
        testUser.id,
        referenceTaskData
      );

      // Assert
      expect(createdTask).toBeDefined();
      expect(createdTask.is_active).toBe(false);
    });
  });

  describe('getUserReferenceTasks', () => {
    it('should return all reference tasks for a user', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create multiple reference tasks
      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Daily Task 1',
        recurrence_type: 'daily',
      });
      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Weekly Task 1',
        recurrence_type: 'weekly',
      });

      // Create a reference task for a different user to ensure isolation
      const otherUser = await fixtures.createTestUser();
      const otherJournal = await fixtures.createTestJournal(otherUser.id);
      await fixtures.createTestReferenceTask(otherUser.id, otherJournal.id, {
        title: 'Other User Task',
      });

      // Act
      const userReferenceTasks =
        await referenceTaskService.getUserReferenceTasks(testUser.id);

      // Assert
      expect(userReferenceTasks).toHaveLength(2);
      expect(userReferenceTasks.map((task) => task.title).sort()).toEqual([
        'Daily Task 1',
        'Weekly Task 1',
      ]);
      expect(
        userReferenceTasks.every((task) => task.user_id === testUser.id)
      ).toBe(true);
    });

    it('should return empty array when user has no reference tasks', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();

      // Act
      const userReferenceTasks =
        await referenceTaskService.getUserReferenceTasks(testUser.id);

      // Assert
      expect(userReferenceTasks).toEqual([]);
    });
  });

  describe('getReferenceTaskById', () => {
    it('should return a reference task by ID', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const createdTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        { title: 'Test Task for Retrieval' }
      );

      // Act
      const retrievedTask = await referenceTaskService.getReferenceTaskById(
        createdTask.id
      );

      // Assert
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask!.id).toBe(createdTask.id);
      expect(retrievedTask!.title).toBe('Test Task for Retrieval');
      expect(retrievedTask!.user_id).toBe(testUser.id);
    });

    it('should return null for non-existent reference task ID', async () => {
      // Use a valid UUID format that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act
      const retrievedTask =
        await referenceTaskService.getReferenceTaskById(nonExistentId);

      // Assert
      expect(retrievedTask).toBeNull();
    });
  });

  describe('updateReferenceTask', () => {
    it('should update an existing reference task', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const createdTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Original Title',
          description: 'Original Description',
          recurrence_type: 'daily',
        }
      );

      const updatedData = {
        journal_id: testJournal.id,
        title: 'Updated Title',
        description: 'Updated Description',
        recurrence_type: 'weekly' as RecurrenceType,
        recurrence_days_of_week: [1, 5], // Mon, Fri
        starts_on: new Date('2024-02-01'),
      };

      // Act
      const updatedTask = await referenceTaskService.updateReferenceTask(
        createdTask.id,
        testUser.id,
        updatedData
      );

      // Assert
      expect(updatedTask).toBeDefined();
      expect(updatedTask.id).toBe(createdTask.id);
      expect(updatedTask.title).toBe(updatedData.title);
      expect(updatedTask.description).toBe(updatedData.description);
      expect(updatedTask.recurrence_type).toBe(updatedData.recurrence_type);
      expect(updatedTask.recurrence_days_of_week).toEqual(
        updatedData.recurrence_days_of_week
      );
      expect(updatedTask.starts_on).toEqual(updatedData.starts_on);
      expect(updatedTask.updated_at.getTime()).toBeGreaterThan(
        createdTask.updated_at.getTime()
      );
    });

    it('should throw error when trying to update non-existent reference task', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const updatedData = {
        journal_id: testJournal.id,
        title: 'Updated Title',
        recurrence_type: 'daily' as RecurrenceType,
        starts_on: new Date('2024-01-01'),
      };

      // Act & Assert
      await expect(
        referenceTaskService.updateReferenceTask(
          nonExistentId,
          testUser.id,
          updatedData
        )
      ).rejects.toThrow('Reference task not found or access denied');
    });

    it('should throw error when trying to update reference task of different user', async () => {
      // Arrange
      const testUser1 = await fixtures.createTestUser();
      const testUser2 = await fixtures.createTestUser();
      const testJournal1 = await fixtures.createTestJournal(testUser1.id);
      const testJournal2 = await fixtures.createTestJournal(testUser2.id);

      const createdTask = await fixtures.createTestReferenceTask(
        testUser1.id,
        testJournal1.id
      );

      const updatedData = {
        journal_id: testJournal2.id,
        title: 'Updated Title',
        recurrence_type: 'daily' as RecurrenceType,
        starts_on: new Date('2024-01-01'),
      };

      // Act & Assert
      await expect(
        referenceTaskService.updateReferenceTask(
          createdTask.id,
          testUser2.id,
          updatedData
        )
      ).rejects.toThrow('Reference task not found or access denied');
    });
  });
});
