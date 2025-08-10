import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createTaskService } from '../../lib/services/taskService';
import { BucketedTask, BUCKET_TO_RECURRENCE_TYPE } from '../../lib/models/Task';

describe('Task Bucketing - Integration Tests', () => {
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

  describe('Task Bucketing by Recurrence Type', () => {
    it('should bucket tasks correctly', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create reference tasks for each recurrence type
      const dailyRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Exercise',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const weeklyRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Weekly Review',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
        }
      );

      const monthlyRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Monthly Planning',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
        }
      );

      const yearlyRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Annual Review',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.yearly,
        }
      );

      const customRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Custom Frequency Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.custom,
          recurrence_interval: 3,
        }
      );

      // Create multiple tasks from each reference task type
      const dailyTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Exercise Instance 1',
          reference_task_id: dailyRefTask.id,
          scheduled_date: new Date('2025-08-01'),
          priority: 100,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Exercise Instance 2',
          reference_task_id: dailyRefTask.id,
          scheduled_date: new Date('2025-08-02'),
          priority: 200,
        }),
      ]);

      const weeklyTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Review Instance 1',
          reference_task_id: weeklyRefTask.id,
          scheduled_date: new Date('2025-08-01'),
          priority: 300,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Review Instance 2',
          reference_task_id: weeklyRefTask.id,
          scheduled_date: new Date('2025-08-08'),
          priority: 400,
        }),
      ]);

      const monthlyTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly Planning Instance 1',
          reference_task_id: monthlyRefTask.id,
          scheduled_date: new Date('2025-08-01'),
          priority: 500,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly Planning Instance 2',
          reference_task_id: monthlyRefTask.id,
          scheduled_date: new Date('2025-09-01'),
          priority: 600,
        }),
      ]);

      const yearlyTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Annual Review Instance 1',
          reference_task_id: yearlyRefTask.id,
          scheduled_date: new Date('2025-08-01'),
          priority: 700,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Annual Review Instance 2',
          reference_task_id: yearlyRefTask.id,
          scheduled_date: new Date('2026-08-01'),
          priority: 800,
        }),
      ]);

      const customTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Custom Task Instance 1',
          reference_task_id: customRefTask.id,
          priority: 900,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Custom Task Instance 2',
          reference_task_id: customRefTask.id,
          priority: 1000,
        }),
      ]);

      // Create multiple regular (one-off) tasks
      const regularTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'One-off Project Task 1',
          priority: 1100,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'One-off Project Task 2',
          priority: 1200,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'One-off Project Task 3',
          priority: 1300,
        }),
      ]);
      const missedTasks = await Promise.all([
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'One-off Project Task -- MISSED',
          priority: 1400,
        }),
      ]);

      await fixtures.markTaskAsMissed(missedTasks[0].id);

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(
        dailyTasks.length +
          weeklyTasks.length +
          monthlyTasks.length +
          yearlyTasks.length +
          customTasks.length +
          regularTasks.length +
          missedTasks.length
      );
      expect(bucketedTasks.daily).toHaveLength(dailyTasks.length);
      expect(bucketedTasks.weekly).toHaveLength(weeklyTasks.length);
      expect(bucketedTasks.monthly).toHaveLength(monthlyTasks.length);
      expect(bucketedTasks.yearly).toHaveLength(yearlyTasks.length);
      expect(bucketedTasks.custom).toHaveLength(customTasks.length);
      expect(bucketedTasks.regular).toHaveLength(regularTasks.length);
      expect(bucketedTasks.missed).toHaveLength(missedTasks.length);

      // Verify specific task bucketing
      const dailyBucketTasks = bucketedTasks.daily;
      const weeklyBucketTasks = bucketedTasks.weekly;
      const monthlyBucketTasks = bucketedTasks.monthly;
      const yearlyBucketTasks = bucketedTasks.yearly;
      const customBucketTasks = bucketedTasks.custom;
      const regularBucketTasks = bucketedTasks.regular;
      const missedBucketTasks = bucketedTasks.missed;

      expect(dailyBucketTasks.every((t) => t.task_bucket === 'daily')).toBe(
        true
      );
      expect(weeklyBucketTasks.every((t) => t.task_bucket === 'weekly')).toBe(
        true
      );
      expect(monthlyBucketTasks.every((t) => t.task_bucket === 'monthly')).toBe(
        true
      );
      expect(yearlyBucketTasks.every((t) => t.task_bucket === 'yearly')).toBe(
        true
      );
      expect(customBucketTasks.every((t) => t.task_bucket === 'custom')).toBe(
        true
      );
      expect(regularBucketTasks.every((t) => t.task_bucket === 'regular')).toBe(
        true
      );
      expect(missedBucketTasks.every((t) => t.task_bucket === 'missed')).toBe(
        true
      );
    });

    it('should prioritize reference tasks over regular tasks', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create reference tasks for all recurrence types
      const dailyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Habit',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const weeklyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Weekly Review',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
        }
      );

      const monthlyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Monthly Planning',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
        }
      );

      const yearlyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Annual Review',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.yearly,
        }
      );

      const customRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Custom Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.custom,
        }
      );

      // Create tasks from all reference types with deliberately high priority numbers
      // that would normally put them LAST in a pure priority sort
      const dailyTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Habit Instance',
          reference_task_id: dailyRef.id,
          priority: 9000, // Very high priority number - would be last in priority sort
        }
      );

      const weeklyTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Weekly Review Instance',
          reference_task_id: weeklyRef.id,
          priority: 8000,
        }
      );

      const monthlyTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Monthly Planning Instance',
          reference_task_id: monthlyRef.id,
          priority: 7000,
        }
      );

      const yearlyTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Annual Review Instance',
          reference_task_id: yearlyRef.id,
          priority: 6000,
        }
      );

      const customTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Custom Task Instance',
          reference_task_id: customRef.id,
          priority: 5000,
        }
      );

      // Create regular tasks with very low priority numbers that would normally come FIRST
      const regularTask1 = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'High Priority Regular Task',
          priority: 1, // Lowest priority number - would be first in priority sort
        }
      );

      const regularTask2 = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Another High Priority Regular Task',
          priority: 2, // Second lowest - would be second in priority sort
        }
      );

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(7);

      // All reference tasks should come before regular tasks, regardless of priority numbers
      // Order should be: daily -> weekly -> monthly -> yearly -> custom -> regular tasks
      // This proves that bucket type overrides priority completely
      expect(bucketedTasks.daily[0].id).toBe(dailyTask.id);
      expect(bucketedTasks.daily[0].task_bucket).toBe('daily');
      expect(bucketedTasks.daily[0].priority).toBe(9000); // Lowest priority

      expect(bucketedTasks.weekly[0].id).toBe(weeklyTask.id);
      expect(bucketedTasks.weekly[0].task_bucket).toBe('weekly');
      expect(bucketedTasks.weekly[0].priority).toBe(8000);

      expect(bucketedTasks.monthly[0].id).toBe(monthlyTask.id);
      expect(bucketedTasks.monthly[0].task_bucket).toBe('monthly');
      expect(bucketedTasks.monthly[0].priority).toBe(7000);

      expect(bucketedTasks.yearly[0].id).toBe(yearlyTask.id);
      expect(bucketedTasks.yearly[0].task_bucket).toBe('yearly');
      expect(bucketedTasks.yearly[0].priority).toBe(6000);

      expect(bucketedTasks.custom[0].id).toBe(customTask.id);
      expect(bucketedTasks.custom[0].task_bucket).toBe('custom');
      expect(bucketedTasks.custom[0].priority).toBe(5000);

      // Regular tasks come last despite having the highest priority
      // This proves bucket type completely overrides priority
      expect(bucketedTasks.regular[0].id).toBe(regularTask1.id);
      expect(bucketedTasks.regular[0].task_bucket).toBe('regular');
      expect(bucketedTasks.regular[0].priority).toBe(1); // Highest priority

      expect(bucketedTasks.regular[1].id).toBe(regularTask2.id);
      expect(bucketedTasks.regular[1].task_bucket).toBe('regular');
      expect(bucketedTasks.regular[1].priority).toBe(2); // Second highest priority

      // Verify that reference tasks come first in their respective buckets
      expect(bucketedTasks.daily).toHaveLength(1);
      expect(bucketedTasks.weekly).toHaveLength(1);
      expect(bucketedTasks.monthly).toHaveLength(1);
      expect(bucketedTasks.yearly).toHaveLength(1);
      expect(bucketedTasks.custom).toHaveLength(1);
      expect(bucketedTasks.regular).toHaveLength(2);

      // Verify all reference tasks have reference_task_id set
      expect(bucketedTasks.daily[0].reference_task_id).not.toBeNull();
      expect(bucketedTasks.weekly[0].reference_task_id).not.toBeNull();
      expect(bucketedTasks.monthly[0].reference_task_id).not.toBeNull();
      expect(bucketedTasks.yearly[0].reference_task_id).not.toBeNull();
      expect(bucketedTasks.custom[0].reference_task_id).not.toBeNull();
    });

    it('should order tasks correctly within buckets', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create multiple daily reference tasks
      const refTask1 = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Morning Routine',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const refTask2 = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Evening Routine',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      // Create tasks with specific priorities
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Morning Routine Instance',
        reference_task_id: refTask1.id,
        priority: 100,
      });

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Evening Routine Instance',
        reference_task_id: refTask2.id,
        priority: 200,
      });

      // Create regular tasks with different priorities
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Urgent Regular Task',
        priority: 50,
      });

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Normal Regular Task',
        priority: 150,
      });

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(4);

      // Should be ordered: daily tasks first (by priority), then regular tasks (by priority)
      expect(bucketedTasks.daily[0].title).toBe('Morning Routine Instance');
      expect(bucketedTasks.daily[0].task_bucket).toBe('daily');
      expect(bucketedTasks.daily[1].title).toBe('Evening Routine Instance');
      expect(bucketedTasks.daily[1].task_bucket).toBe('daily');
      expect(bucketedTasks.regular[0].title).toBe('Urgent Regular Task');
      expect(bucketedTasks.regular[0].task_bucket).toBe('regular');
      expect(bucketedTasks.regular[1].title).toBe('Normal Regular Task');
      expect(bucketedTasks.regular[1].task_bucket).toBe('regular');
    });

    it('should handle custom recurrence type correctly', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const customRefTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Custom Frequency Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.custom,
          recurrence_interval: 3,
        }
      );

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Custom Task Instance',
        reference_task_id: customRefTask.id,
      });

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(1);
      expect(bucketedTasks.custom[0].task_bucket).toBe('custom');
    });

    it('should only return pending tasks when filtering by completion status', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const refTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Task',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      // Create completed and pending tasks
      const completedTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Completed Daily Task',
          reference_task_id: refTask.id,
        }
      );

      const pendingTask = await fixtures.createTestTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Pending Daily Task',
          reference_task_id: refTask.id,
        }
      );

      // Mark one task as completed
      await taskService.updateTask(completedTask.id, testUser.id, {
        completed: true,
        completed_at: new Date(),
      });

      // Test pending tasks only
      const pendingBucketedTasks =
        await taskService.getUserTasksBucketedHierarchical(testUser.id, {
          completed: false,
        });

      expect(Object.values(pendingBucketedTasks).flat()).toHaveLength(1);
      expect(pendingBucketedTasks.daily[0].id).toBe(pendingTask.id);
      expect(pendingBucketedTasks.daily[0].completed).toBe(false);

      // Test completed tasks only
      const completedBucketedTasks =
        await taskService.getUserTasksBucketedHierarchical(testUser.id, {
          completed: true,
        });

      expect(Object.values(completedBucketedTasks).flat()).toHaveLength(1);
      expect(completedBucketedTasks.daily[0].id).toBe(completedTask.id);
      expect(completedBucketedTasks.daily[0].completed).toBe(true);

      // Test all tasks
      const allBucketedTasks =
        await taskService.getUserTasksBucketedHierarchical(testUser.id);

      expect(Object.values(allBucketedTasks).flat()).toHaveLength(2);
    });

    it('should handle tasks without reference tasks gracefully', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create multiple regular tasks
      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Regular Task 1',
        priority: 100,
      });

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Regular Task 2',
        priority: 200,
      });

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(2);
      expect(bucketedTasks.regular).toHaveLength(2);
      expect(
        bucketedTasks.regular.every(
          (task: BucketedTask) => task.task_bucket === 'regular'
        )
      ).toBe(true);
      expect(bucketedTasks.regular[0].title).toBe('Regular Task 1');
      expect(bucketedTasks.regular[1].title).toBe('Regular Task 2');
    });

    it('should include only reference task id in bucketed results', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      const refTask = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Meditation',
          description: 'Meditate for 10 minutes',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      await fixtures.createTestTask(testUser.id, testJournal.id, {
        title: 'Daily Meditation Instance',
        reference_task_id: refTask.id,
      });

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(1);
      const bucketedTask = bucketedTasks.daily[0];

      expect(bucketedTask.reference_task_id).toBe(refTask.id);
      expect(bucketedTask.task_bucket).toBe('daily');
    });
  });

  describe('Service Layer Integration', () => {
    it('should integrate bucketed tasks through task service', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create a mix of reference and regular tasks with multiple tasks per bucket
      const dailyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Standup',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const weeklyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Weekly Team Meeting',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
        }
      );

      const monthlyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Monthly One-on-One',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
        }
      );

      // Create multiple tasks for each bucket
      await Promise.all([
        // Daily tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Standup Instance 1',
          reference_task_id: dailyRef.id,
          priority: 100,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Standup Instance 2',
          reference_task_id: dailyRef.id,
          priority: 200,
        }),

        // Weekly tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Team Meeting Instance 1',
          reference_task_id: weeklyRef.id,
          priority: 300,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Team Meeting Instance 2',
          reference_task_id: weeklyRef.id,
          priority: 400,
        }),

        // Monthly tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly One-on-One Instance 1',
          reference_task_id: monthlyRef.id,
          priority: 500,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly One-on-One Instance 2',
          reference_task_id: monthlyRef.id,
          priority: 600,
        }),

        // Regular tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Project Work Task 1',
          priority: 700,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Project Work Task 2',
          priority: 800,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Project Work Task 3',
          priority: 900,
        }),
      ]);

      // Test through service layer
      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(bucketedTasks.daily).toHaveLength(2);
      expect(bucketedTasks.weekly).toHaveLength(2);
      expect(bucketedTasks.monthly).toHaveLength(2);
      expect(bucketedTasks.yearly).toHaveLength(0);
      expect(bucketedTasks.custom).toHaveLength(0);
      expect(bucketedTasks.regular).toHaveLength(3);

      // Verify task ordering within buckets (should be by priority)
      expect(bucketedTasks.daily[0].title).toBe('Daily Standup Instance 1');
      expect(bucketedTasks.daily[1].title).toBe('Daily Standup Instance 2');
      expect(bucketedTasks.weekly[0].title).toBe(
        'Weekly Team Meeting Instance 1'
      );
      expect(bucketedTasks.weekly[1].title).toBe(
        'Weekly Team Meeting Instance 2'
      );
      expect(bucketedTasks.monthly[0].title).toBe(
        'Monthly One-on-One Instance 1'
      );
      expect(bucketedTasks.monthly[1].title).toBe(
        'Monthly One-on-One Instance 2'
      );
      expect(bucketedTasks.regular[0].title).toBe('Project Work Task 1');
      expect(bucketedTasks.regular[1].title).toBe('Project Work Task 2');
      expect(bucketedTasks.regular[2].title).toBe('Project Work Task 3');
    });

    it('should handle empty buckets correctly', async () => {
      const testUser = await fixtures.createTestUser();

      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(bucketedTasks.daily).toHaveLength(0);
      expect(bucketedTasks.weekly).toHaveLength(0);
      expect(bucketedTasks.monthly).toHaveLength(0);
      expect(bucketedTasks.yearly).toHaveLength(0);
      expect(bucketedTasks.custom).toHaveLength(0);
      expect(bucketedTasks.regular).toHaveLength(0);
    });

    it('should maintain correct cross-bucket ordering with multiple tasks per bucket', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create reference tasks for all types
      const dailyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Daily Habit',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily,
        }
      );

      const weeklyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Weekly Review',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly,
        }
      );

      const monthlyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Monthly Planning',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.monthly,
        }
      );

      const yearlyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Yearly Goal Setting',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.yearly,
        }
      );

      const customRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        {
          title: 'Custom Frequency',
          recurrence_type: BUCKET_TO_RECURRENCE_TYPE.custom,
        }
      );

      // Create multiple tasks for each bucket with intentionally mixed priorities
      await Promise.all([
        // Regular tasks (should come last regardless of low priority numbers)
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Regular Task A',
          priority: 1, // Very low priority number
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Regular Task B',
          priority: 5,
        }),

        // Daily tasks (should come first)
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Task A',
          reference_task_id: dailyRef.id,
          priority: 1000, // High priority number
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Daily Task B',
          reference_task_id: dailyRef.id,
          priority: 2000,
        }),

        // Weekly tasks (should come after daily)
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Task A',
          reference_task_id: weeklyRef.id,
          priority: 500,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Weekly Task B',
          reference_task_id: weeklyRef.id,
          priority: 600,
        }),

        // Monthly tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly Task A',
          reference_task_id: monthlyRef.id,
          priority: 300,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Monthly Task B',
          reference_task_id: monthlyRef.id,
          priority: 400,
        }),

        // Yearly tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Yearly Task A',
          reference_task_id: yearlyRef.id,
          priority: 100,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Yearly Task B',
          reference_task_id: yearlyRef.id,
          priority: 200,
        }),

        // Custom tasks
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Custom Task A',
          reference_task_id: customRef.id,
          priority: 700,
        }),
        fixtures.createTestTask(testUser.id, testJournal.id, {
          title: 'Custom Task B',
          reference_task_id: customRef.id,
          priority: 800,
        }),
      ]);

      // Test the raw bucketed ordering from service
      const bucketedTasks = await taskService.getUserTasksBucketedHierarchical(
        testUser.id
      );

      expect(Object.values(bucketedTasks).flat()).toHaveLength(12);

      // Test through service layer - verify bucket structure
      const serviceBuckets = bucketedTasks;

      expect(serviceBuckets.daily).toHaveLength(2);
      expect(serviceBuckets.weekly).toHaveLength(2);
      expect(serviceBuckets.monthly).toHaveLength(2);
      expect(serviceBuckets.yearly).toHaveLength(2);
      expect(serviceBuckets.custom).toHaveLength(2);
      expect(serviceBuckets.regular).toHaveLength(2);

      // Verify order within each bucket (by priority)
      expect(serviceBuckets.daily[0].title).toBe('Daily Task A');
      expect(serviceBuckets.daily[1].title).toBe('Daily Task B');
      expect(serviceBuckets.weekly[0].title).toBe('Weekly Task A');
      expect(serviceBuckets.weekly[1].title).toBe('Weekly Task B');
      expect(serviceBuckets.monthly[0].title).toBe('Monthly Task A');
      expect(serviceBuckets.monthly[1].title).toBe('Monthly Task B');
      expect(serviceBuckets.yearly[0].title).toBe('Yearly Task A');
      expect(serviceBuckets.yearly[1].title).toBe('Yearly Task B');
      expect(serviceBuckets.custom[0].title).toBe('Custom Task A');
      expect(serviceBuckets.custom[1].title).toBe('Custom Task B');
      expect(serviceBuckets.regular[0].title).toBe('Regular Task A');
      expect(serviceBuckets.regular[1].title).toBe('Regular Task B');
    });
  });
});
