import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createTaskService } from '../../lib/services/taskService';
import { createTaskRepository } from '../../lib/repositories/taskRepository';
import { BucketedTask, BUCKET_TO_RECURRENCE_TYPE } from '../../lib/models/Task';

describe.sequential('Task Bucketing - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let taskService: ReturnType<typeof createTaskService>;
  let taskRepository: ReturnType<typeof createTaskRepository>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    taskService = createTaskService(query);
    taskRepository = createTaskRepository(query);

    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('Task Bucketing by Recurrence Type', () => {
    it('should bucket tasks correctly by their reference task recurrence type', async () => {
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

      // Test the bucketing query directly
      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(13); // 2+2+2+2+2+3 = 13 tasks total

      // Verify bucketing counts
      const bucketCounts = {
        daily: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'daily'
        ).length,
        weekly: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'weekly'
        ).length,
        monthly: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'monthly'
        ).length,
        yearly: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'yearly'
        ).length,
        custom: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'custom'
        ).length,
        regular: bucketedTasks.filter(
          (t: BucketedTask) => t.task_bucket === 'regular'
        ).length,
      };

      expect(bucketCounts.daily).toBe(2);
      expect(bucketCounts.weekly).toBe(2);
      expect(bucketCounts.monthly).toBe(2);
      expect(bucketCounts.yearly).toBe(2);
      expect(bucketCounts.custom).toBe(2);
      expect(bucketCounts.regular).toBe(3);

      // Verify specific task bucketing
      const dailyBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        dailyTasks.some((dt) => dt.id === t.id)
      );
      const weeklyBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        weeklyTasks.some((wt) => wt.id === t.id)
      );
      const monthlyBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        monthlyTasks.some((mt) => mt.id === t.id)
      );
      const yearlyBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        yearlyTasks.some((yt) => yt.id === t.id)
      );
      const customBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        customTasks.some((ct) => ct.id === t.id)
      );
      const regularBucketTasks = bucketedTasks.filter((t: BucketedTask) =>
        regularTasks.some((rt) => rt.id === t.id)
      );

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

      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(7);

      // All reference tasks should come before regular tasks, regardless of priority numbers
      // Order should be: daily -> weekly -> monthly -> yearly -> custom -> regular tasks
      // This proves that bucket type overrides priority completely
      expect(bucketedTasks[0].id).toBe(dailyTask.id);
      expect(bucketedTasks[0].task_bucket).toBe('daily');
      expect(bucketedTasks[0].priority).toBe(9000); // Lowest priority

      expect(bucketedTasks[1].id).toBe(weeklyTask.id);
      expect(bucketedTasks[1].task_bucket).toBe('weekly');
      expect(bucketedTasks[1].priority).toBe(8000);

      expect(bucketedTasks[2].id).toBe(monthlyTask.id);
      expect(bucketedTasks[2].task_bucket).toBe('monthly');
      expect(bucketedTasks[2].priority).toBe(7000);

      expect(bucketedTasks[3].id).toBe(yearlyTask.id);
      expect(bucketedTasks[3].task_bucket).toBe('yearly');
      expect(bucketedTasks[3].priority).toBe(6000);

      expect(bucketedTasks[4].id).toBe(customTask.id);
      expect(bucketedTasks[4].task_bucket).toBe('custom');
      expect(bucketedTasks[4].priority).toBe(5000);

      // Regular tasks come last despite having the highest priority
      // This proves bucket type completely overrides priority
      expect(bucketedTasks[5].id).toBe(regularTask1.id);
      expect(bucketedTasks[5].task_bucket).toBe('regular');
      expect(bucketedTasks[5].priority).toBe(1); // Highest priority

      expect(bucketedTasks[6].id).toBe(regularTask2.id);
      expect(bucketedTasks[6].task_bucket).toBe('regular');
      expect(bucketedTasks[6].priority).toBe(2); // Second highest priority

      // Verify that NO regular tasks appear before reference tasks
      const firstRegularTaskIndex = bucketedTasks.findIndex(
        (task) => task.task_bucket === 'regular'
      );
      expect(firstRegularTaskIndex).toBe(5); // Should be at index 5 (6th position)

      const tasksBeforeRegular = bucketedTasks.slice(0, firstRegularTaskIndex);
      expect(
        tasksBeforeRegular.every((task) => task.reference_task_id !== null)
      ).toBe(true);
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

      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(4);

      // Should be ordered: daily tasks first (by priority), then regular tasks (by priority)
      expect(bucketedTasks[0].title).toBe('Morning Routine Instance');
      expect(bucketedTasks[0].task_bucket).toBe('daily');
      expect(bucketedTasks[1].title).toBe('Evening Routine Instance');
      expect(bucketedTasks[1].task_bucket).toBe('daily');
      expect(bucketedTasks[2].title).toBe('Urgent Regular Task');
      expect(bucketedTasks[2].task_bucket).toBe('regular');
      expect(bucketedTasks[3].title).toBe('Normal Regular Task');
      expect(bucketedTasks[3].task_bucket).toBe('regular');
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

      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(1);
      expect(bucketedTasks[0].task_bucket).toBe('custom');
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
      await taskRepository.update(completedTask.id, {
        completed: true,
        completed_at: new Date(),
      });

      // Test pending tasks only
      const pendingBucketedTasks =
        await taskRepository.findBucketedTasksByUserId(testUser.id, {
          completed: false,
        });

      expect(pendingBucketedTasks).toHaveLength(1);
      expect(pendingBucketedTasks[0].id).toBe(pendingTask.id);
      expect(pendingBucketedTasks[0].completed).toBe(false);

      // Test completed tasks only
      const completedBucketedTasks =
        await taskRepository.findBucketedTasksByUserId(testUser.id, {
          completed: true,
        });

      expect(completedBucketedTasks).toHaveLength(1);
      expect(completedBucketedTasks[0].id).toBe(completedTask.id);
      expect(completedBucketedTasks[0].completed).toBe(true);

      // Test all tasks
      const allBucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(allBucketedTasks).toHaveLength(2);
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

      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(2);
      expect(
        bucketedTasks.every(
          (task: BucketedTask) => task.task_bucket === 'regular'
        )
      ).toBe(true);
      expect(bucketedTasks[0].title).toBe('Regular Task 1');
      expect(bucketedTasks[1].title).toBe('Regular Task 2');
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

      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(1);
      const bucketedTask = bucketedTasks[0];

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
      const bucketedTasks = await taskService.getUserTasksBucketed(testUser.id);

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

      const bucketedTasks = await taskService.getUserTasksBucketed(testUser.id);

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

      // Test the raw bucketed ordering from repository
      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );

      expect(bucketedTasks).toHaveLength(12);

      // Verify the order: daily -> weekly -> monthly -> yearly -> custom -> regular
      const taskTitles = bucketedTasks.map((task) => task.title);

      // Daily tasks should come first (ordered by priority within bucket)
      expect(taskTitles[0]).toBe('Daily Task A');
      expect(taskTitles[1]).toBe('Daily Task B');

      // Weekly tasks should come next
      expect(taskTitles[2]).toBe('Weekly Task A');
      expect(taskTitles[3]).toBe('Weekly Task B');

      // Monthly tasks
      expect(taskTitles[4]).toBe('Monthly Task A');
      expect(taskTitles[5]).toBe('Monthly Task B');

      // Yearly tasks
      expect(taskTitles[6]).toBe('Yearly Task A');
      expect(taskTitles[7]).toBe('Yearly Task B');

      // Custom tasks
      expect(taskTitles[8]).toBe('Custom Task A');
      expect(taskTitles[9]).toBe('Custom Task B');

      // Regular tasks should come last (despite having lowest priority numbers)
      expect(taskTitles[10]).toBe('Regular Task A');
      expect(taskTitles[11]).toBe('Regular Task B');

      // Test through service layer as well
      const serviceBuckets = await taskService.getUserTasksBucketed(
        testUser.id
      );

      expect(serviceBuckets.daily).toHaveLength(2);
      expect(serviceBuckets.weekly).toHaveLength(2);
      expect(serviceBuckets.monthly).toHaveLength(2);
      expect(serviceBuckets.yearly).toHaveLength(2);
      expect(serviceBuckets.custom).toHaveLength(2);
      expect(serviceBuckets.regular).toHaveLength(2);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of tasks efficiently', async () => {
      const testUser = await fixtures.createTestUser();
      const testJournal = await fixtures.createTestJournal(testUser.id);

      // Create reference tasks for different types
      const dailyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        { recurrence_type: BUCKET_TO_RECURRENCE_TYPE.daily }
      );

      const weeklyRef = await fixtures.createTestReferenceTask(
        testUser.id,
        testJournal.id,
        { recurrence_type: BUCKET_TO_RECURRENCE_TYPE.weekly }
      );

      // Create many tasks
      const taskPromises = [];
      for (let i = 0; i < 50; i++) {
        if (i % 3 === 0) {
          taskPromises.push(
            fixtures.createTestTask(testUser.id, testJournal.id, {
              title: `Daily Task ${i}`,
              reference_task_id: dailyRef.id,
              priority: i,
            })
          );
        } else if (i % 3 === 1) {
          taskPromises.push(
            fixtures.createTestTask(testUser.id, testJournal.id, {
              title: `Weekly Task ${i}`,
              reference_task_id: weeklyRef.id,
              priority: i,
            })
          );
        } else {
          taskPromises.push(
            fixtures.createTestTask(testUser.id, testJournal.id, {
              title: `Regular Task ${i}`,
              priority: i,
            })
          );
        }
      }

      await Promise.all(taskPromises);

      const startTime = Date.now();
      const bucketedTasks = await taskRepository.findBucketedTasksByUserId(
        testUser.id
      );
      const endTime = Date.now();

      expect(bucketedTasks).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second

      // Verify ordering is maintained
      const dailyTasks = bucketedTasks.filter(
        (task: BucketedTask) => task.task_bucket === 'daily'
      );
      const weeklyTasks = bucketedTasks.filter(
        (task: BucketedTask) => task.task_bucket === 'weekly'
      );
      const regularTasks = bucketedTasks.filter(
        (task: BucketedTask) => task.task_bucket === 'regular'
      );

      expect(dailyTasks.length + weeklyTasks.length + regularTasks.length).toBe(
        50
      );

      // Reference tasks should come before regular tasks
      const firstRegularTaskIndex = bucketedTasks.findIndex(
        (task: BucketedTask) => task.task_bucket === 'regular'
      );
      if (firstRegularTaskIndex > -1) {
        const tasksBeforeRegular = bucketedTasks.slice(
          0,
          firstRegularTaskIndex
        );
        expect(
          tasksBeforeRegular.every(
            (task: BucketedTask) => task.reference_task_id !== null
          )
        ).toBe(true);
      }
    });
  });
});
