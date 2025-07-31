import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createTaskService } from '../../lib/services/taskService';

describe.sequential('TaskService - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let taskService: ReturnType<typeof createTaskService>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    taskService = createTaskService(query);

    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('getUserTasks', () => {
    it('should return all tasks for a user with hierarchical ordering', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Parent Task',
        priority: 1,
      });
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Another Task',
        priority: 2,
      });

      const userTasks = await taskService.getUserTasks(testUser.id);

      expect(userTasks).toHaveLength(2);
      expect(userTasks.map((t) => t.title).sort()).toEqual([
        'Another Task',
        'Parent Task',
      ]);
      expect(userTasks.every((t) => t.user_id === testUser.id)).toBe(true);
    });

    it('should return empty array for user with no tasks', async () => {
      const testUser = await fixtures.createTestUser();

      const userTasks = await taskService.getUserTasks(testUser.id);

      expect(userTasks).toHaveLength(0);
    });
  });

  describe('getJournalTasks', () => {
    it('should return tasks for a journal when user owns it', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Journal Task 1',
      });
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Journal Task 2',
      });

      const journalTasks = await taskService.getJournalTasks(
        testJournal.id,
        testUser.id
      );

      expect(journalTasks).toHaveLength(2);
      expect(journalTasks.map((t) => t.title).sort()).toEqual([
        'Journal Task 1',
        'Journal Task 2',
      ]);
    });

    it('should return tasks for a public journal regardless of ownership', async () => {
      const owner = await fixtures.createTestUser();
      const viewer = await fixtures.createTestUser();
      const publicJournal = await fixtures.createTestJournal(owner.id, {
        public: true,
      });

      await fixtures.createTestTask(owner.id, publicJournal.id, {
        title: 'Public Task',
      });

      const journalTasks = await taskService.getJournalTasks(
        publicJournal.id,
        viewer.id
      );

      expect(journalTasks).toHaveLength(1);
      expect(journalTasks[0].title).toBe('Public Task');
    });

    it('should return empty array for private journal when user does not own it', async () => {
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const privateJournal = await fixtures.createTestJournal(owner.id, {
        public: false,
      });

      await fixtures.createTestTask(owner.id, privateJournal.id, {
        title: 'Private Task',
      });

      const journalTasks = await taskService.getJournalTasks(
        privateJournal.id,
        otherUser.id
      );

      expect(journalTasks).toHaveLength(0);
    });

    it('should return empty array for non-existent journal', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const journalTasks = await taskService.getJournalTasks(
        nonExistentId,
        testUser.id
      );

      expect(journalTasks).toHaveLength(0);
    });
  });

  describe('getTaskById', () => {
    it('should return task when user owns the journal', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const task = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Test Task',
      });

      const result = await taskService.getTaskById(task.id, testUser.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(task.id);
      expect(result!.title).toBe('Test Task');
    });

    it('should return task for public journal regardless of ownership', async () => {
      const owner = await fixtures.createTestUser();
      const viewer = await fixtures.createTestUser();
      const publicJournal = await fixtures.createTestJournal(owner.id, {
        public: true,
      });
      const task = await fixtures.createTestTask(owner.id, publicJournal.id, {
        title: 'Public Task',
      });

      const result = await taskService.getTaskById(task.id, viewer.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(task.id);
    });

    it('should return null for private journal when user does not own it', async () => {
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const privateJournal = await fixtures.createTestJournal(owner.id, {
        public: false,
      });
      const task = await fixtures.createTestTask(owner.id, privateJournal.id, {
        title: 'Private Task',
      });

      const result = await taskService.getTaskById(task.id, otherUser.id);

      expect(result).toBeNull();
    });

    it('should return null for non-existent task', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.getTaskById(nonExistentId, testUser.id);

      expect(result).toBeNull();
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const taskData = {
        journal_id: testJournal.id,
        title: 'New Task',
        description: 'Task description',
      };

      const createdTask = await taskService.createTask(testUser.id, taskData);

      expect(createdTask).toBeDefined();
      expect(createdTask!.title).toBe(taskData.title);
      expect(createdTask!.description).toBe(taskData.description);
      expect(createdTask!.journal_id).toBe(testJournal.id);
      expect(createdTask!.user_id).toBe(testUser.id);
      expect(createdTask!.completed).toBe(false);
    });

    it('should return null when journal does not exist', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentJournalId = '00000000-0000-0000-0000-000000000000';

      const taskData = {
        journal_id: nonExistentJournalId,
        title: 'New Task',
      };

      const result = await taskService.createTask(testUser.id, taskData);

      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update an existing task when user owns it', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const task = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Original Title',
        description: 'Original Description',
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedTask = await taskService.updateTask(
        task.id,
        testUser.id,
        updateData
      );

      expect(updatedTask).toBeDefined();
      expect(updatedTask!.title).toBe(updateData.title);
      expect(updatedTask!.description).toBe(updateData.description);
      expect(updatedTask!.id).toBe(task.id);
    });

    it('should return null when task does not exist', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.updateTask(nonExistentId, testUser.id, {
        title: 'Updated Title',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task when user owns it', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const task = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task to Delete',
      });

      const result = await taskService.deleteTask(task.id, testUser.id);

      expect(result).toBe(true);

      const deletedTask = await taskService.getTaskById(task.id, testUser.id);
      expect(deletedTask).toBeNull();
    });

    it('should return false when task does not exist', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.deleteTask(nonExistentId, testUser.id);

      expect(result).toBe(false);
    });
  });

  describe('toggleTaskCompletion', () => {
    it('should toggle task completion from incomplete to complete', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const task = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task to Complete',
      });

      const result = await taskService.toggleTaskCompletion(
        task.id,
        testUser.id
      );

      expect(result.task).toBeDefined();
      expect(result.task!.completed).toBe(true);
      expect(result.task!.completed_at).toBeDefined();
      expect(result.canComplete).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should toggle task completion from complete to incomplete', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const task = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task to Uncomplete',
      });

      // First complete the task
      await taskService.toggleTaskCompletion(task.id, testUser.id);

      // Then uncomplete it
      const result = await taskService.toggleTaskCompletion(
        task.id,
        testUser.id
      );

      expect(result.task).toBeDefined();
      expect(result.task!.completed).toBe(false);
      expect(result.task!.completed_at).toBeNull();
      expect(result.canComplete).toBe(true);
    });

    it('should return error when task does not exist', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.toggleTaskCompletion(
        nonExistentId,
        testUser.id
      );

      expect(result.task).toBeNull();
      expect(result.canComplete).toBe(false);
      expect(result.error).toBe('Task not found');
    });

    it('should return error when user does not own the journal', async () => {
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(owner.id);
      const task = await fixtures.createTestTask(owner.id, testJournal.id, {
        title: 'Other User Task',
      });

      const result = await taskService.toggleTaskCompletion(
        task.id,
        otherUser.id
      );

      expect(result.task).toBeNull();
      expect(result.canComplete).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('reorderTask', () => {
    it('should reorder a task above another task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const task1 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 1',
        priority: 1,
      });
      const task2 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 2',
        priority: 2,
      });

      const reorderedTask = await taskService.reorderTask(
        task2.id,
        testUser.id,
        task1.id,
        'above'
      );

      expect(reorderedTask).toBeDefined();
      expect(reorderedTask!.id).toBe(task2.id);
      expect(reorderedTask!.priority).toBeLessThan(task1.priority);
    });

    it('should return null when task does not exist', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);
      const referenceTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        { title: 'Reference Task' }
      );

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.reorderTask(
        nonExistentId,
        testUser.id,
        referenceTask.id,
        'above'
      );

      expect(result).toBeNull();
    });

    it('should return null when user does not own the task', async () => {
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(owner.id);

      const task1 = await fixtures.createTestTask(owner.id, testJournal.id, {
        title: 'Task 1',
      });
      const task2 = await fixtures.createTestTask(owner.id, testJournal.id, {
        title: 'Task 2',
      });

      const result = await taskService.reorderTask(
        task1.id,
        otherUser.id,
        task2.id,
        'above'
      );

      expect(result).toBeNull();
    });
  });

  describe('createTasksFromReferenceTasksForUser', () => {
    it('should create tasks from active reference tasks for a user', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Daily Reference Task',
        recurrence_type: 'daily',
        starts_on: new Date('2024-01-01'),
        is_active: true,
      });

      const targetDate = new Date('2024-01-15');
      const result = await taskService.createTasksFromReferenceTasksForUser(
        testUser.id,
        targetDate
      );

      expect(result.tasks_created).toBeDefined();
      expect(result.tasks_skipped).toBeDefined();
    });

    it('should not create tasks for inactive reference tasks', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Inactive Reference Task',
        recurrence_type: 'daily',
        starts_on: new Date('2024-01-01'),
        is_active: false,
      });

      const targetDate = new Date('2024-01-15');
      const result = await taskService.createTasksFromReferenceTasksForUser(
        testUser.id,
        targetDate
      );

      expect(parseInt(result.tasks_created)).toBe(0);
    });
  });
});
