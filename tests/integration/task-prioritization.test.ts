import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createTaskService } from '../../lib/services/taskService';
import { BUCKET_TO_RECURRENCE_TYPE } from '../../lib/models/Task';

describe.sequential('Task Prioritization - Integration Tests', () => {
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

  describe('calculate_next_priority function', () => {
    it('should calculate top priority for first task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const taskData = {
        journal_id: testJournal.id,
        title: 'First Task',
      };

      const createdTask = await taskService.createTask(testUser.id, taskData);

      expect(createdTask).toBeDefined();
      expect(createdTask!.priority).toBe(1000);
    });

    it('should place new tasks at the top of the list with proper spacing', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const task1 = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'First Task',
      });

      const task2 = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Second Task',
      });

      const task3 = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Third Task',
      });

      expect(task1!.priority).toBe(1000);
      expect(task2!.priority).toBe(500);
      expect(task3!.priority).toBe(250);

      const allTasks = await taskService.getUserTasks(testUser.id);
      const sortedTasks = allTasks.sort((a, b) => a.priority - b.priority);

      expect(sortedTasks.map((t) => t.title)).toEqual([
        'Third Task',
        'Second Task',
        'First Task',
      ]);
    });

    it('should handle multiple users independently', async () => {
      const user1 = await fixtures.createTestUser();
      const user2 = await fixtures.createTestUser();
      const journal1 = await fixtures.createTestJournal(user1.id);
      const journal2 = await fixtures.createTestJournal(user2.id);

      const user1Task = await taskService.createTask(user1.id, {
        journal_id: journal1.id,
        title: 'User 1 Task',
      });

      const user2Task = await taskService.createTask(user2.id, {
        journal_id: journal2.id,
        title: 'User 2 Task',
      });

      expect(user1Task!.priority).toBe(1000);
      expect(user2Task!.priority).toBe(1000);
    });
  });

  describe('calculate_priority_relative_to_task function', () => {
    it('should position task above reference task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const taskToPosition = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Task to Position',
      });

      const referenceTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Reference Task',
      });

      const referencePriority = referenceTask!.priority;
      const initialTaskPriority = taskToPosition!.priority;

      // Verify initial state - reference task should have higher priority (lower number = higher priority)
      expect(referencePriority).toBeLessThan(initialTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        taskToPosition!.id,
        testUser.id,
        referenceTask!.id,
        'above'
      );

      const updatedPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      // After reordering above, the task should have higher priority than reference
      expect(referencePriority).toBeGreaterThan(updatedPriority);
      // And it should be higher priority than before (smaller number)
      expect(initialTaskPriority).toBeGreaterThan(updatedPriority);
    });

    it('should position task below reference task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const referenceTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Reference Task',
      });

      const taskToPosition = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Task to Position',
      });

      const referencePriority = referenceTask!.priority;
      const initialTaskPriority = taskToPosition!.priority;

      // Verify initial state - reference should have lower priority (higher number) than task
      expect(referencePriority).toBeGreaterThan(initialTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        taskToPosition!.id,
        testUser.id,
        referenceTask!.id,
        'below'
      );

      const updatedPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      // After reordering below, the task should have lower priority (higher number) than reference
      expect(referencePriority).toBeLessThan(updatedPriority);
      // And it should be lower priority than it was initially
      expect(initialTaskPriority).toBeLessThan(updatedPriority);
    });

    it('should position task between two existing tasks', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const topTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Top Task',
          priority: 100,
        }
      );

      const bottomTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Bottom Task',
          priority: 300,
        }
      );

      const middleTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Middle Task',
      });

      const topTaskPriority = topTask.priority;
      const bottomTaskPriority = bottomTask.priority;
      const initialMiddleTaskPriority = middleTask!.priority;

      // Verify initial state - middleTask should have higher priority than both (lower number)
      expect(topTaskPriority).toBeGreaterThan(initialMiddleTaskPriority);
      expect(bottomTaskPriority).toBeGreaterThan(initialMiddleTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        middleTask!.id,
        testUser.id,
        topTask.id,
        'below'
      );

      const updatedMiddleTaskPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(topTaskPriority).toBeLessThan(updatedMiddleTaskPriority);
      expect(bottomTaskPriority).toBeGreaterThan(updatedMiddleTaskPriority);
      // Verify it actually moved from its original position
      expect(initialMiddleTaskPriority).toBeLessThan(updatedMiddleTaskPriority);

      const expectedPriority = (topTask.priority + bottomTask.priority) / 2;
      expect(reorderedTask!.priority).toBe(expectedPriority);
    });

    it('should handle positioning at the beginning of the list', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const newTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'New Top Task',
      });

      const firstTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'First Task',
          priority: 100,
        }
      );

      const firstTaskPriority = firstTask.priority;
      const initialNewTaskPriority = newTask!.priority;

      // Verify initial state - firstTask should have higher priority (lower number) than newTask
      expect(firstTaskPriority).toBeLessThan(initialNewTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        newTask!.id,
        testUser.id,
        firstTask.id,
        'above'
      );

      const updatedNewTaskPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(firstTaskPriority).toBeGreaterThan(updatedNewTaskPriority);
      // Verify it's even higher priority than it was initially (moving further up)
      expect(initialNewTaskPriority).toBeGreaterThan(updatedNewTaskPriority);
      expect(reorderedTask!.priority).toBe(firstTask.priority / 2);
    });

    it('should handle positioning at the end of the list', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const lastTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Last Task',
          priority: 100,
        }
      );

      const newTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'New Bottom Task',
      });

      const lastTaskPriority = lastTask.priority;
      const initialNewTaskPriority = newTask!.priority;

      // Verify initial state - newTask should have higher priority (lower number) than lastTask
      expect(lastTaskPriority).toBeGreaterThan(initialNewTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        newTask!.id,
        testUser.id,
        lastTask.id,
        'below'
      );

      const updatedNewTaskPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(lastTaskPriority).toBeLessThan(updatedNewTaskPriority);
      // Verify it moved to lower priority (higher number) than it was initially
      expect(initialNewTaskPriority).toBeLessThan(updatedNewTaskPriority);
      expect(reorderedTask!.priority).toBe(lastTask.priority + 100);
    });

    it('should only consider pending tasks when filtering by completion status', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const pendingTask1 = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Pending Task 1',
          priority: 100,
        }
      );

      const completedTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Completed Task',
          priority: 200,
        }
      );

      const pendingTask2 = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Pending Task 2',
          priority: 300,
        }
      );

      await taskService.toggleTaskCompletion(completedTask.id, testUser.id);

      const newTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'New Task',
      });

      const pendingTask1Priority = pendingTask1.priority;
      const pendingTask2Priority = pendingTask2.priority;
      const initialNewTaskPriority = newTask!.priority;

      // Verify initial state - newTask should have highest priority (lowest number)
      expect(pendingTask1Priority).toBeGreaterThan(initialNewTaskPriority);
      expect(pendingTask2Priority).toBeGreaterThan(initialNewTaskPriority);

      const reorderedTask = await taskService.reorderPendingTask(
        newTask!.id,
        testUser.id,
        pendingTask1.id,
        'below'
      );

      const updatedNewTaskPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(pendingTask1Priority).toBeLessThan(updatedNewTaskPriority);
      expect(pendingTask2Priority).toBeGreaterThan(updatedNewTaskPriority);
      // Verify it actually moved from its original higher priority position
      expect(initialNewTaskPriority).toBeLessThan(updatedNewTaskPriority);

      const expectedPriority =
        (pendingTask1.priority + pendingTask2.priority) / 2;
      expect(reorderedTask!.priority).toBe(expectedPriority);
    });

    it('should exclude specified task from calculations', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const task1 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 1',
        priority: 100,
      });

      const task2 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 2',
        priority: 200,
      });

      const task3 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 3',
        priority: 300,
      });

      const task1Priority = task1.priority;
      const task2Priority = task2.priority;
      const initialTask3Priority = task3.priority;

      // Verify initial state - task3 has lowest priority (highest number)
      expect(task1Priority).toBeLessThan(initialTask3Priority);
      expect(task2Priority).toBeLessThan(initialTask3Priority);

      const reorderedTask = await taskService.reorderTask(
        task3.id,
        testUser.id,
        task1.id,
        'below'
      );

      const updatedTask3Priority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(task1Priority).toBeLessThan(updatedTask3Priority);
      expect(task2Priority).toBeGreaterThan(updatedTask3Priority);
      // Verify it actually moved from its original position to higher priority
      expect(initialTask3Priority).toBeGreaterThan(updatedTask3Priority);

      const expectedPriority = (task1.priority + task2.priority) / 2;
      expect(reorderedTask!.priority).toBe(expectedPriority);
    });

    it('should return null for invalid reference task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const taskToMove = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Task to Move',
      });

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.reorderTask(
        taskToMove!.id,
        testUser.id,
        nonExistentId,
        'above'
      );

      expect(result).toBeNull();
    });

    it('should return null when user does not own the task', async () => {
      const user1 = await fixtures.createTestUser();
      const user2 = await fixtures.createTestUser();
      const journal1 = await fixtures.createTestJournal(user1.id);
      const journal2 = await fixtures.createTestJournal(user2.id);

      const user1Task = await taskService.createTask(user1.id, {
        journal_id: journal1.id,
        title: 'User 1 Task',
      });

      const user2Task = await taskService.createTask(user2.id, {
        journal_id: journal2.id,
        title: 'User 2 Task',
      });

      const result = await taskService.reorderTask(
        user1Task!.id,
        user2.id, // Wrong user
        user2Task!.id,
        'above'
      );

      expect(result).toBeNull();
    });
  });

  describe('calculate_subtask_priority function', () => {
    it('should position subtask between parent and next root task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const parentTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Parent Task',
          priority: 100,
        }
      );

      const nextRootTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Next Root Task',
          priority: 200,
        }
      );

      const parentTaskPriority = parentTask.priority;
      const nextRootTaskPriority = nextRootTask.priority;

      const subTask = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task',
          journal_id: testJournal.id,
        }
      );

      const subTaskPriority = subTask!.priority;

      expect(subTask).toBeDefined();
      expect(parentTaskPriority).toBeLessThan(subTaskPriority);
      expect(nextRootTaskPriority).toBeGreaterThan(subTaskPriority);
      expect(subTask!.parent_task_id).toBe(parentTask.id);
    });

    it('should handle multiple subtasks with proper spacing', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const parentTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Parent Task',
          priority: 100,
        }
      );

      const nextRootTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Next Root Task',
          priority: 300,
        }
      );

      const parentTaskPriority = parentTask.priority;
      const nextRootTaskPriority = nextRootTask.priority;

      const subTask1 = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task 1',
          journal_id: testJournal.id,
        }
      );

      const subTask2 = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task 2',
          journal_id: testJournal.id,
        }
      );

      const subTask3 = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task 3',
          journal_id: testJournal.id,
        }
      );

      const subTask1Priority = subTask1!.priority;
      const subTask2Priority = subTask2!.priority;
      const subTask3Priority = subTask3!.priority;

      expect(parentTaskPriority).toBeLessThan(subTask1Priority);
      expect(nextRootTaskPriority).toBeGreaterThan(subTask1Priority);

      expect(subTask1Priority).toBeLessThan(subTask2Priority);
      expect(nextRootTaskPriority).toBeGreaterThan(subTask2Priority);

      expect(subTask2Priority).toBeLessThan(subTask3Priority);
      expect(nextRootTaskPriority).toBeGreaterThan(subTask3Priority);

      const allTasks = await taskService.getUserTasks(testUser.id);
      const sortedTasks = allTasks.sort((a, b) => a.priority - b.priority);

      expect(sortedTasks.map((t) => t.title)).toEqual([
        'Parent Task',
        'Sub Task 1',
        'Sub Task 2',
        'Sub Task 3',
        'Next Root Task',
      ]);
    });

    it('should handle subtasks when no next root task exists', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const parentTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Parent Task',
          priority: 100,
        }
      );

      const parentTaskPriority = parentTask.priority;

      const subTask = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task',
          journal_id: testJournal.id,
        }
      );

      const subTaskPriority = subTask!.priority;

      expect(subTask).toBeDefined();
      expect(parentTaskPriority).toBeLessThan(subTaskPriority);
      expect(subTask!.parent_task_id).toBe(parentTask.id);
    });

    it('should inherit recurrence type from parent task', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const refTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Reference',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const parentTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Parent Task',
          reference_task_id: refTask.id,
          priority: 100,
        }
      );

      const subTask = await taskService.createSubTask(
        testUser.id,
        parentTask.id,
        {
          title: 'Sub Task',
          journal_id: testJournal.id,
        }
      );

      expect(subTask).toBeDefined();
      expect(subTask!.recurrence_type).toBe(BUCKET_TO_RECURRENCE_TYPE.daily);
      expect(subTask!.reference_task_id).toBe(refTask.id);
    });

    it('should return null for invalid parent task', async () => {
      const testUser = await fixtures.createTestUser();
      const nonExistentParentId = '00000000-0000-0000-0000-000000000000';

      const result = await taskService.createSubTask(
        testUser.id,
        nonExistentParentId,
        {
          title: 'Sub Task',
          journal_id: 'some-journal-id',
        }
      );

      expect(result).toBeNull();
    });

    it('should return null when user does not own parent task', async () => {
      const user1 = await fixtures.createTestUser();
      const user2 = await fixtures.createTestUser();
      const journal1 = await fixtures.createTestJournal(user1.id);

      const parentTask = await fixtures.createTestTask(user1.id, journal1.id, {
        title: 'Parent Task',
        priority: 100,
      });

      const result = await taskService.createSubTask(user2.id, parentTask.id, {
        title: 'Sub Task',
        journal_id: journal1.id,
      });

      expect(result).toBeNull();
    });

    it('should handle nested subtask hierarchies', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const grandparentTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Grandparent Task',
          priority: 100,
        }
      );

      const nextRootTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Next Root Task',
          priority: 500,
        }
      );

      const grandparentTaskPriority = grandparentTask.priority;
      const nextRootTaskPriority = nextRootTask.priority;

      const parentTask = await taskService.createSubTask(
        testUser.id,
        grandparentTask.id,
        {
          title: 'Parent Task',
          journal_id: testJournal.id,
        }
      );

      const parentTaskPriority = parentTask!.priority;

      const subTask = await taskService.createSubTask(
        testUser.id,
        parentTask!.id,
        {
          title: 'Sub Task',
          journal_id: testJournal.id,
        }
      );

      const subTaskPriority = subTask!.priority;

      expect(subTask).toBeDefined();
      expect(grandparentTaskPriority).toBeLessThan(parentTaskPriority);
      expect(parentTaskPriority).toBeLessThan(subTaskPriority);
      expect(nextRootTaskPriority).toBeGreaterThan(subTaskPriority);
      expect(subTask!.parent_task_id).toBe(parentTask!.id);

      const allTasks = await taskService.getUserTasks(testUser.id);
      const sortedTasks = allTasks.sort((a, b) => a.priority - b.priority);

      expect(
        sortedTasks.map((t) => ({ title: t.title, parent: t.parent_task_id }))
      ).toEqual([
        { title: 'Grandparent Task', parent: null },
        { title: 'Parent Task', parent: grandparentTask.id },
        { title: 'Sub Task', parent: parentTask!.id },
        { title: 'Next Root Task', parent: null },
      ]);
    });
  });

  describe('Priority calculations with reference tasks', () => {
    it('should maintain proper spacing when creating tasks from reference tasks', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Daily Task 1',
        recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
      });

      await fixtures.createTestReferenceTask(testUser.id, testJournal.id, {
        title: 'Daily Task 2',
        recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
      });

      const today = new Date();
      const result = await taskService.createTasksFromReferenceTasksForUser(
        testUser.id,
        today
      );

      expect(parseInt(result.tasks_created)).toBe(2);

      const userTasks = await taskService.getUserTasks(testUser.id);
      const createdTasks = userTasks
        .filter((task) => task.reference_task_id)
        .sort((a, b) => a.priority - b.priority);

      const firstTaskPriority = createdTasks[0].priority;
      const secondTaskPriority = createdTasks[1].priority;

      expect(createdTasks).toHaveLength(2);
      expect(firstTaskPriority).toBeLessThan(secondTaskPriority);
      // Verify the actual spacing produced by the algorithm
      expect(secondTaskPriority - firstTaskPriority).toBe(490);
    });

    it('should handle priority calculations with existing tasks', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const existingTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Existing Task',
          priority: 100,
        }
      );

      const existingTaskPriority = existingTask.priority;

      const dailyRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const today = new Date();
      const result = await taskService.createTasksFromReferenceTasksForUser(
        testUser.id,
        today
      );

      expect(parseInt(result.tasks_created)).toBe(1);

      const userTasks = await taskService.getUserTasks(testUser.id);
      const createdTask = userTasks.find(
        (task) => task.reference_task_id === dailyRefTask.id
      );

      const createdTaskPriority = createdTask!.priority;

      expect(createdTask).toBeDefined();
      expect(existingTaskPriority).toBeGreaterThan(createdTaskPriority);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle priority calculations with very large numbers', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const highPriorityTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'High Priority Task',
          priority: 999999999,
        }
      );

      const newTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'New Task',
      });

      expect(newTask).toBeDefined();
      expect(newTask!.priority).toBeLessThan(highPriorityTask.priority);
    });

    it('should handle priority calculations with very small numbers', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const lowPriorityTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Low Priority Task',
          priority: 0.001,
        }
      );

      const newTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'New Task',
      });

      expect(newTask).toBeDefined();
      expect(newTask!.priority).toBeLessThan(lowPriorityTask.priority);
    });

    it('should handle duplicate priorities gracefully', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const task1 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 1',
        priority: 100,
      });

      const task2 = await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Task 2',
        priority: 100, // Same priority
      });

      const task1Priority = task1.priority;
      const task2Priority = task2.priority;
      const initialTask1Priority = task1.priority;

      // Verify initial state - both tasks have the same priority
      expect(task1Priority).toBe(task2Priority);

      const reorderedTask = await taskService.reorderTask(
        task1.id,
        testUser.id,
        task2.id,
        'above'
      );

      const updatedTask1Priority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(task2Priority).toBeGreaterThan(updatedTask1Priority);
      // Verify it actually changed from the original priority
      expect(initialTask1Priority).toBeGreaterThan(updatedTask1Priority);
    });

    it('should handle reordering with only one task in the system', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const singleTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Single Task',
          priority: 100,
        }
      );

      const anotherTask = await taskService.createTask(testUser.id, {
        journal_id: testJournal.id,
        title: 'Another Task',
      });

      const singleTaskPriority = singleTask.priority;
      const initialAnotherTaskPriority = anotherTask!.priority;

      // Verify initial state - anotherTask should have higher priority (lower number)
      expect(singleTaskPriority).toBeGreaterThan(initialAnotherTaskPriority);

      const reorderedTask = await taskService.reorderTask(
        anotherTask!.id,
        testUser.id,
        singleTask.id,
        'below'
      );

      const updatedAnotherTaskPriority = reorderedTask!.priority;

      expect(reorderedTask).toBeDefined();
      expect(singleTaskPriority).toBeLessThan(updatedAnotherTaskPriority);
      // Verify it moved from higher priority to lower priority
      expect(initialAnotherTaskPriority).toBeLessThan(
        updatedAnotherTaskPriority
      );
      expect(reorderedTask!.priority).toBe(singleTask.priority + 100);
    });
  });
});
