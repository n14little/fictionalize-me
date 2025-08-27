import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createTaskService } from '../../lib/services/taskService';
import { BUCKET_TO_RECURRENCE_TYPE } from '../../lib/models/Task';

// Utility function to create date-only objects (no time component)
function createDateOnly(date?: Date | string | number): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Utility functions for relative dates
function getToday(): Date {
  return createDateOnly();
}

function getYesterday(): Date {
  const date = createDateOnly();
  date.setDate(date.getDate() - 1);
  return date;
}

function getTomorrow(): Date {
  const date = createDateOnly();
  date.setDate(date.getDate() + 1);
  return date;
}

function getDaysFromToday(days: number): Date {
  const date = createDateOnly();
  date.setDate(date.getDate() + days);
  return date;
}

function getMonthsFromToday(months: number): Date {
  const date = createDateOnly();
  date.setMonth(date.getMonth() + months);
  return date;
}

function getYearsFromToday(years: number): Date {
  const date = createDateOnly();
  date.setFullYear(date.getFullYear() + years);
  return date;
}

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
        priority: '0|000001',
      });
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Another Task',
        priority: '0|000002',
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

  describe('createTasksFromReferenceTasksForUser', () => {
    it('should create tasks from active reference tasks for a user', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Daily Reference Task',
        recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
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
        recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
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

    describe('Weekly Recurrence Task Creation', () => {
      it('should create weekly tasks only on the correct recurrence intervals', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Weekly Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
          recurrence_interval: 1,
          starts_on: today,
          is_active: true,
        });

        const tomorrow = getTomorrow();
        const dayAfter = getDaysFromToday(2);
        const threeDaysLater = getDaysFromToday(3);
        const fourDaysLater = getDaysFromToday(4);
        const fiveDaysLater = getDaysFromToday(5);
        const oneWeekLater = getDaysFromToday(7);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          tomorrow
        );
        expect(parseInt(result2.tasks_created)).toBe(0);

        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          dayAfter
        );
        expect(parseInt(result3.tasks_created)).toBe(0);

        const result4 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          threeDaysLater
        );
        expect(parseInt(result4.tasks_created)).toBe(0);

        const result5 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          fourDaysLater
        );
        expect(parseInt(result5.tasks_created)).toBe(0);

        const result6 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          fiveDaysLater
        );
        expect(parseInt(result6.tasks_created)).toBe(0);

        const result7 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneWeekLater
        );
        expect(parseInt(result7.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const weeklyTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(weeklyTasks).toHaveLength(2);

        expect(weeklyTasks[0].scheduled_date).toEqual(today);
        expect(weeklyTasks[1].scheduled_date).toEqual(oneWeekLater);
      });

      it('should create bi-weekly tasks only every two weeks', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Bi-Weekly Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
          recurrence_interval: 2,
          starts_on: today,
          is_active: true,
        });

        const oneWeekLater = getDaysFromToday(7);
        const twoWeeksLater = getDaysFromToday(14);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneWeekLater
        );
        expect(parseInt(result2.tasks_created)).toBe(0);

        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          twoWeeksLater
        );
        expect(parseInt(result3.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const biWeeklyTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(biWeeklyTasks).toHaveLength(2);

        expect(biWeeklyTasks[0].scheduled_date).toEqual(today);
        expect(biWeeklyTasks[1].scheduled_date).toEqual(twoWeeksLater);
      });

      it('should create weekly tasks on specific days of the week', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Get today's day of the week (0 = Sunday, 1 = Monday, etc.)
        const todayDayOfWeek = today.getDay();
        const tomorrowDayOfWeek = (todayDayOfWeek + 1) % 7;

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Specific Days Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
          recurrence_interval: 1,
          recurrence_days_of_week: [todayDayOfWeek, tomorrowDayOfWeek],
          starts_on: yesterday,
          is_active: true,
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const threeDaysLater = new Date();
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);
        const oneWeekLater = new Date();
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);

        const resultToday =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            today
          );
        expect(parseInt(resultToday.tasks_created)).toBe(1);

        const resultTomorrow =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            tomorrow
          );
        expect(parseInt(resultTomorrow.tasks_created)).toBe(1);

        const resultDayAfter =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            dayAfter
          );
        expect(parseInt(resultDayAfter.tasks_created)).toBe(0);

        const resultThreeDaysLater =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            threeDaysLater
          );
        expect(parseInt(resultThreeDaysLater.tasks_created)).toBe(0);

        const resultOneWeekLater =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            oneWeekLater
          );
        expect(parseInt(resultOneWeekLater.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const weeklyTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(weeklyTasks).toHaveLength(3);

        // Create dates without time components for comparison
        const todayDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const tomorrowDate = new Date(
          tomorrow.getFullYear(),
          tomorrow.getMonth(),
          tomorrow.getDate()
        );
        const oneWeekLaterDate = new Date(
          oneWeekLater.getFullYear(),
          oneWeekLater.getMonth(),
          oneWeekLater.getDate()
        );

        expect(weeklyTasks[0].scheduled_date).toEqual(todayDate);
        expect(weeklyTasks[1].scheduled_date).toEqual(tomorrowDate);
        expect(weeklyTasks[2].scheduled_date).toEqual(oneWeekLaterDate);
      });
    });

    describe('Monthly Recurrence Task Creation', () => {
      it('should create monthly tasks only on the correct monthly intervals', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();
        const todayDayOfMonth = today.getDate();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Monthly Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
          recurrence_interval: 1,
          recurrence_day_of_month: todayDayOfMonth,
          starts_on: today,
          is_active: true,
        });

        const tomorrow = getTomorrow();
        const oneMonthLater = getMonthsFromToday(1);
        const twoMonthsLater = getMonthsFromToday(2);

        // First call: should create task for today and update next_scheduled_date to next month
        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        // Tomorrow: should not create any tasks (not the monthly recurrence date)
        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          tomorrow
        );
        expect(parseInt(result2.tasks_created)).toBe(0);

        // One month later: should create task and update next_scheduled_date to following month
        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneMonthLater
        );
        expect(parseInt(result3.tasks_created)).toBe(1);

        // Two months later: should create task
        const result4 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          twoMonthsLater
        );
        expect(parseInt(result4.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const monthlyTasks = userTasks.filter((task) => task.reference_task_id);
        expect(monthlyTasks).toHaveLength(3);
      });

      it('should create quarterly tasks only every three months', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();
        const todayDayOfMonth = today.getDate();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Quarterly Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
          recurrence_interval: 3,
          recurrence_day_of_month: todayDayOfMonth,
          starts_on: today,
          is_active: true,
        });

        const oneMonthLater = getMonthsFromToday(1);
        const twoMonthsLater = getMonthsFromToday(2);
        const threeMonthsLater = getMonthsFromToday(3);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneMonthLater
        );
        expect(parseInt(result2.tasks_created)).toBe(0);

        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          twoMonthsLater
        );
        expect(parseInt(result3.tasks_created)).toBe(0);

        const result4 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          threeMonthsLater
        );
        expect(parseInt(result4.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const quarterlyTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(quarterlyTasks).toHaveLength(2);
        expect(quarterlyTasks[0].scheduled_date).toEqual(today);
        expect(quarterlyTasks[1].scheduled_date).toEqual(threeMonthsLater);
      });
    });

    describe('Daily Recurrence Task Creation', () => {
      it('should create daily tasks every day', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // Use dates relative to today for realistic testing
        const yesterday = getYesterday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Daily Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: yesterday, // Started yesterday
          is_active: true,
        });

        const today = getToday();
        const tomorrow = getTomorrow();
        const dayAfter = getDaysFromToday(2);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          tomorrow
        );
        expect(parseInt(result2.tasks_created)).toBe(1);

        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          dayAfter
        );
        expect(parseInt(result3.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const dailyTasks = userTasks.filter((task) => task.reference_task_id);
        expect(dailyTasks).toHaveLength(3);
      });

      it('should create every-other-day tasks only on correct intervals', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // For every-other-day, start "today" so tomorrow is the first scheduled day
        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Every Other Day Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 2,
          starts_on: today, // Start today
          is_active: true,
        });

        const tomorrow = getTomorrow();
        const dayAfter = getDaysFromToday(2);
        const threeDaysLater = getDaysFromToday(3);
        const fourDaysLater = getDaysFromToday(4);

        // Today (day 0) - should create first task immediately since starts_on is today
        const result0 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result0.tasks_created)).toBe(1);

        // Tomorrow (day 1) - should not create (not an even interval)
        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          tomorrow
        );
        expect(parseInt(result1.tasks_created)).toBe(0);

        // Day after tomorrow (day 2) - should create (even interval)
        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          dayAfter
        );
        expect(parseInt(result2.tasks_created)).toBe(1);

        // Three days later (day 3) - should not create (odd interval)
        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          threeDaysLater
        );
        expect(parseInt(result3.tasks_created)).toBe(0);

        // Four days later (day 4) - should create (even interval)
        const result4 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          fourDaysLater
        );
        expect(parseInt(result4.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const everyOtherDayTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(everyOtherDayTasks).toHaveLength(3); // Today, day after tomorrow, and four days later
        expect(everyOtherDayTasks[0].scheduled_date).toEqual(today);
        expect(everyOtherDayTasks[1].scheduled_date).toEqual(dayAfter);
        expect(everyOtherDayTasks[2].scheduled_date).toEqual(fourDaysLater);
      });
    });

    describe('Yearly Recurrence Task Creation', () => {
      it('should create yearly tasks only once per year', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Annual Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.yearly,
          recurrence_interval: 1,
          starts_on: today,
          is_active: true,
        });

        const oneMonthLater = getMonthsFromToday(1);
        const sixMonthsLater = getMonthsFromToday(6);
        const oneYearLater = getYearsFromToday(1);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneMonthLater
        );
        expect(parseInt(result2.tasks_created)).toBe(0);

        const result3 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          sixMonthsLater
        );
        expect(parseInt(result3.tasks_created)).toBe(0);

        const result4 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          oneYearLater
        );
        expect(parseInt(result4.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const yearlyTasks = userTasks
          .filter((task) => task.reference_task_id)
          .sort(
            (a, b) =>
              new Date(a.scheduled_date!).getTime() -
              new Date(b.scheduled_date!).getTime()
          );
        expect(yearlyTasks).toHaveLength(2);
        expect(yearlyTasks[0].scheduled_date).toEqual(today);
        expect(yearlyTasks[1].scheduled_date).toEqual(oneYearLater);
      });
    });

    describe('Task Duplication Prevention', () => {
      it('should not create duplicate tasks for the same date', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Daily Reference Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: today,
          is_active: true,
        });

        // First call: should create task and update next_scheduled_date
        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);
        expect(parseInt(result1.tasks_skipped)).toBe(0);

        // Second call with same date: should not create anything (no reference tasks due today anymore)
        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result2.tasks_created)).toBe(0);
        expect(parseInt(result2.tasks_skipped)).toBe(0);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const createdTasks = userTasks.filter(
          (task) =>
            task.reference_task_id &&
            task.scheduled_date?.toDateString() === today.toDateString()
        );
        expect(createdTasks).toHaveLength(1);
      });

      it('should handle multiple reference tasks without creating duplicates', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Daily Task 1',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: today,
          is_active: true,
        });

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Daily Task 2',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: today,
          is_active: true,
        });

        // First call: should create tasks for both reference tasks and update their next_scheduled_dates
        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(2);
        expect(parseInt(result1.tasks_skipped)).toBe(0);

        // Second call with same date: should not create anything (no reference tasks due today anymore)
        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result2.tasks_created)).toBe(0);
        expect(parseInt(result2.tasks_skipped)).toBe(0);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const createdTasks = userTasks.filter(
          (task) =>
            task.reference_task_id &&
            task.scheduled_date?.toDateString() === today.toDateString()
        );
        expect(createdTasks).toHaveLength(2);
      });
    });

    describe('Reference Task Properties Inheritance', () => {
      it('should create tasks with correct properties from reference task', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const today = getToday();

        const referenceTask = await fixtures.createTestReferenceTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Test Reference Task Title',
            description: 'Test Reference Task Description',
            recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
            recurrence_interval: 1,
            starts_on: today,
            is_active: true,
          }
        );

        const result = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );

        expect(parseInt(result.tasks_created)).toBe(1);

        const userTasks = await taskService.getUserTasks(testUser.id);
        const createdTask = userTasks.find(
          (task) => task.reference_task_id === referenceTask.id
        );

        expect(createdTask).toBeDefined();
        expect(createdTask!.title).toBe('Test Reference Task Title');
        expect(createdTask!.description).toBe(
          'Test Reference Task Description'
        );
        expect(createdTask!.journal_id).toBe(testJournal.id);
        expect(createdTask!.user_id).toBe(testUser.id);
        expect(createdTask!.recurrence_type).toBe(
          BUCKET_TO_RECURRENCE_TYPE.weekly
        );
        expect(createdTask!.scheduled_date).toEqual(today);
        expect(createdTask!.completed).toBe(false);
        expect(createdTask!.reference_task_id).toBe(referenceTask.id);
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle reference tasks with end dates', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
          title: 'Limited Duration Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: yesterday,
          ends_on: tomorrow,
          is_active: true,
        });

        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const resultTomorrow =
          await taskService.createTasksFromReferenceTasksForUser(
            testUser.id,
            tomorrow
          );
        expect(parseInt(resultTomorrow.tasks_created)).toBe(1);

        const result2 = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          threeDaysLater
        );
        expect(parseInt(result2.tasks_created)).toBe(0);
      });

      it('should return zero results for user with no reference tasks', async () => {
        const testUser = await fixtures.createTestUser();
        const today = new Date();

        const result = await taskService.createTasksFromReferenceTasksForUser(
          testUser.id,
          today
        );

        expect(parseInt(result.tasks_created)).toBe(0);
        expect(parseInt(result.tasks_skipped)).toBe(0);
      });

      it('should only process tasks for the specified user', async () => {
        const user1 = await fixtures.createTestUser();
        const user2 = await fixtures.createTestUser();
        const journal1 = await fixtures.createTestJournal(user1.id);
        const journal2 = await fixtures.createTestJournal(user2.id);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await fixtures.createTestReferenceTask(user1.id, journal1.id, {
          title: 'User 1 Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: yesterday,
          is_active: true,
        });

        await fixtures.createTestReferenceTask(user2.id, journal2.id, {
          title: 'User 2 Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          recurrence_interval: 1,
          starts_on: yesterday,
          is_active: true,
        });

        const today = new Date();

        const result1 = await taskService.createTasksFromReferenceTasksForUser(
          user1.id,
          today
        );
        expect(parseInt(result1.tasks_created)).toBe(1);

        const user1Tasks = await taskService.getUserTasks(user1.id);
        const user2Tasks = await taskService.getUserTasks(user2.id);

        expect(
          user1Tasks.filter((task) => task.reference_task_id)
        ).toHaveLength(1);
        expect(
          user2Tasks.filter((task) => task.reference_task_id)
        ).toHaveLength(0);
      });
    });
  });

  describe('Hierarchical Task Operations', () => {
    describe('createSubTask', () => {
      it('should create a sub-task under a parent task', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // Create parent task
        const parentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Parent Task',
          }
        );

        const subTaskData = {
          title: 'Sub Task',
          description: 'Sub task description',
          journal_id: testJournal.id, // This will be inherited from parent
        };

        const createdSubTask = await taskService.createSubTask(
          testUser.id,
          parentTask.id,
          subTaskData
        );

        expect(createdSubTask).toBeDefined();
        expect(createdSubTask!.title).toBe(subTaskData.title);
        expect(createdSubTask!.description).toBe(subTaskData.description);
        expect(createdSubTask!.parent_task_id).toBe(parentTask.id);
        expect(createdSubTask!.user_id).toBe(testUser.id);
        expect(createdSubTask!.journal_id).toBe(testJournal.id);
      });

      it('should return null when parent task does not exist', async () => {
        const testUser = await fixtures.createTestUser();
        const nonExistentParentId = '00000000-0000-0000-0000-000000000000';

        const subTaskData = {
          title: 'Sub Task',
          journal_id: 'some-journal-id',
        };

        const result = await taskService.createSubTask(
          testUser.id,
          nonExistentParentId,
          subTaskData
        );

        expect(result).toBeNull();
      });

      it('should return null when user does not own parent task', async () => {
        const owner = await fixtures.createTestUser();
        const otherUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(owner.id);

        const parentTask = await fixtures.createTestTask(
          owner.id,
          testJournal.id,
          {
            title: 'Parent Task',
          }
        );

        const subTaskData = {
          title: 'Sub Task',
          journal_id: testJournal.id,
        };

        const result = await taskService.createSubTask(
          otherUser.id,
          parentTask.id,
          subTaskData
        );

        expect(result).toBeNull();
      });
    });

    describe('getValidParentTasks', () => {
      it('should return valid parent tasks for a given task', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // Create several tasks
        const task1 = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Task 1',
          }
        );
        await fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Task 2',
        });
        await fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Task 3',
        });

        const validParents = await taskService.getValidParentTasks(
          task1.id,
          testUser.id
        );

        expect(validParents).toHaveLength(2);
        const parentTitles = validParents.map((t) => t.title).sort();
        expect(parentTitles).toEqual(['Task 2', 'Task 3']);

        // Should not include the task itself
        expect(validParents.some((t) => t.id === task1.id)).toBe(false);
      });

      it('should exclude tasks that would create cycles', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // Create parent and child tasks
        const parentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Parent Task',
          }
        );
        const childTask = await taskService.createSubTask(
          testUser.id,
          parentTask.id,
          { title: 'Child Task', journal_id: testJournal.id }
        );
        const siblingTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Sibling Task',
          }
        );

        // Get valid parents for the parent task - should not include its own child
        const validParents = await taskService.getValidParentTasks(
          parentTask.id,
          testUser.id
        );

        expect(validParents.some((t) => t.id === childTask!.id)).toBe(false);
        expect(validParents.some((t) => t.id === parentTask.id)).toBe(false);
        expect(validParents.some((t) => t.id === siblingTask.id)).toBe(true);
      });

      it('should return empty array for user with no other tasks', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const onlyTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Only Task',
          }
        );

        const validParents = await taskService.getValidParentTasks(
          onlyTask.id,
          testUser.id
        );

        expect(validParents).toHaveLength(0);
      });
    });

    describe('getUserTasksBucketedHierarchical', () => {
      it('should return tasks with hierarchical ordering preserved within buckets', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        // Create reference tasks for different buckets
        const dailyRefTask = await fixtures.createTestReferenceTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Daily Habit',
            recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
          }
        );

        // Create tasks with hierarchy
        const dailyParentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Daily Parent Task',
            reference_task_id: dailyRefTask.id,
            priority: '0|000100',
          }
        );

        await taskService.createSubTask(testUser.id, dailyParentTask.id, {
          title: 'Daily Sub Task',
          journal_id: testJournal.id,
        });

        const regularParentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Regular Parent Task',
            priority: '0|000200',
          }
        );

        await taskService.createSubTask(testUser.id, regularParentTask.id, {
          title: 'Regular Sub Task',
          journal_id: testJournal.id,
        });

        const buckets = await taskService.getUserTasksBucketedHierarchical(
          testUser.id
        );

        // Check daily bucket has hierarchical ordering
        expect(buckets.daily).toHaveLength(2);
        expect(buckets.daily[0].title).toBe('Daily Parent Task');
        expect(buckets.daily[1].title).toBe('Daily Sub Task');
        expect(buckets.daily[1].parent_task_id).toBe(buckets.daily[0].id);

        // Check regular bucket has hierarchical ordering
        expect(buckets.regular).toHaveLength(2);
        expect(buckets.regular[0].title).toBe('Regular Parent Task');
        expect(buckets.regular[1].title).toBe('Regular Sub Task');
        expect(buckets.regular[1].parent_task_id).toBe(buckets.regular[0].id);

        // Other buckets should be empty
        expect(buckets.weekly).toHaveLength(0);
        expect(buckets.monthly).toHaveLength(0);
        expect(buckets.yearly).toHaveLength(0);
        expect(buckets.custom).toHaveLength(0);
      });

      it('should filter by completion status while preserving hierarchy', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const parentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Parent Task',
            priority: '0|000100',
          }
        );

        const completedSubTask = await taskService.createSubTask(
          testUser.id,
          parentTask.id,
          { title: 'Completed Sub Task', journal_id: testJournal.id }
        );

        await taskService.createSubTask(testUser.id, parentTask.id, {
          title: 'Pending Sub Task',
          journal_id: testJournal.id,
        });

        // Complete one sub-task
        await taskService.toggleTaskCompletion(
          completedSubTask!.id,
          testUser.id
        );

        // Test pending tasks only
        const pendingBuckets =
          await taskService.getUserTasksBucketedHierarchical(testUser.id, {
            completed: false,
          });

        expect(pendingBuckets.regular).toHaveLength(2);
        expect(pendingBuckets.regular.map((t) => t.title)).toEqual([
          'Parent Task',
          'Pending Sub Task',
        ]);

        // Test completed tasks only
        const completedBuckets =
          await taskService.getUserTasksBucketedHierarchical(testUser.id, {
            completed: true,
          });

        expect(completedBuckets.regular).toHaveLength(1);
        expect(completedBuckets.regular[0].title).toBe('Completed Sub Task');
      });

      it('should handle deep hierarchies correctly', async () => {
        const testUser = await fixtures.createTestUser();
        const testJournal = await fixtures.createTestJournal(testUser.id);

        const parentTask = await fixtures.createTestTask(
          testUser.id,
          testJournal.id,
          {
            title: 'Parent Task',
            priority: '0|000100',
          }
        );

        const level1Task = await taskService.createSubTask(
          testUser.id,
          parentTask.id,
          { title: 'Level 1 Task', journal_id: testJournal.id }
        );

        await taskService.createSubTask(testUser.id, level1Task!.id, {
          title: 'Level 2 Task',
          journal_id: testJournal.id,
        });

        const buckets = await taskService.getUserTasksBucketedHierarchical(
          testUser.id
        );

        expect(buckets.regular).toHaveLength(3);
        expect(buckets.regular[0].title).toBe('Parent Task');
        expect(buckets.regular[0].parent_task_id).toBeNull();
        expect(buckets.regular[1].title).toBe('Level 1 Task');
        expect(buckets.regular[1].parent_task_id).toBe(parentTask.id);
        expect(buckets.regular[2].title).toBe('Level 2 Task');
        expect(buckets.regular[2].parent_task_id).toBe(level1Task!.id);
      });
    });
  });
});
