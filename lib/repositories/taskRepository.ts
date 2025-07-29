import { query } from '../db';
import { QueryFunction } from '../db/types';
import { Task, CreateTask, UpdateTask } from '../models/Task';
import { ReferenceTask, CreateReferenceTask } from '../models/ReferenceTask';

export const createTaskRepository = (queryFn: QueryFunction) => {
  const repository = {
    /**
     * Find all tasks for a user
     */
    findByUserId: async (userId: number): Promise<Task[]> => {
      const result = await queryFn(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY priority ASC',
        [userId]
      );
      return result.rows as Task[];
    },

    /**
     * Find all tasks for a specific journal
     */
    findByJournalId: async (journalId: string): Promise<Task[]> => {
      const result = await queryFn(
        'SELECT * FROM tasks WHERE journal_id = $1 ORDER BY priority ASC',
        [journalId]
      );
      return result.rows as Task[];
    },

    /**
     * Find a task by ID
     */
    findById: async (id: string): Promise<Task | null> => {
      const result = await queryFn('SELECT * FROM tasks WHERE id = $1', [id]);
      return (result.rows[0] as Task) || null;
    },

    /**
     * Create a new task
     */
    create: async (taskData: CreateTask): Promise<Task> => {
      const result = await queryFn(
        `INSERT INTO tasks (
        journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
      ) VALUES (
        $1, $2, $3, $4, 
        CASE 
          WHEN $5::INTEGER IS NOT NULL THEN $5::INTEGER
          ELSE COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $2), 0) + 1000
        END,
        $6, $7
      ) RETURNING *`,
        [
          taskData.journal_id,
          taskData.user_id,
          taskData.title,
          taskData.description || null,
          taskData.priority || null,
          taskData.reference_task_id || null,
          taskData.scheduled_date || null,
        ]
      );
      return result.rows[0] as Task;
    },

    /**
     * Update an existing task
     */
    update: async (id: string, taskData: UpdateTask): Promise<Task | null> => {
      const sets = [];
      const values = [];
      let paramIndex = 1;

      if (taskData.title !== undefined) {
        sets.push(`title = $${paramIndex}`);
        values.push(taskData.title);
        paramIndex++;
      }

      if (taskData.description !== undefined) {
        sets.push(`description = $${paramIndex}`);
        values.push(taskData.description);
        paramIndex++;
      }

      if (taskData.priority !== undefined) {
        sets.push(`priority = $${paramIndex}`);
        values.push(taskData.priority);
        paramIndex++;
      }

      if (taskData.completed !== undefined) {
        sets.push(`completed = $${paramIndex}`);
        values.push(taskData.completed);
        paramIndex++;

        // When marking as complete or incomplete, also update completed_at
        if (taskData.completed) {
          sets.push(`completed_at = NOW()`);
        } else {
          sets.push(`completed_at = NULL`);
        }
      } else if (taskData.completed_at !== undefined) {
        sets.push(`completed_at = $${paramIndex}`);
        values.push(taskData.completed_at);
        paramIndex++;
      }

      if (sets.length === 0) {
        return await repository.findById(id);
      }

      sets.push(`updated_at = NOW()`);

      values.push(id);
      const result = await queryFn(
        `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      return (result.rows[0] as Task) || null;
    },

    /**
     * Delete a task
     */
    delete: async (id: string): Promise<boolean> => {
      const result = await queryFn(
        'DELETE FROM tasks WHERE id = $1 RETURNING id',
        [id]
      );
      if (result.rowCount) {
        return result.rowCount > 0;
      }

      return false;
    },

    /**
     * Update priority for a specific task
     */
    updatePriority: async (
      id: string,
      priority: number
    ): Promise<Task | null> => {
      const result = await queryFn(
        'UPDATE tasks SET priority = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [priority, id]
      );
      return (result.rows[0] as Task) || null;
    },

    /**
     * Get tasks by user with priority range for calculating new priorities
     */
    getTasksForReordering: async (userId: number): Promise<Task[]> => {
      const result = await queryFn(
        'SELECT id, priority FROM tasks WHERE user_id = $1 ORDER BY priority ASC',
        [userId]
      );
      return result.rows as Task[];
    },

    /**
     * Get priority of a specific task
     */
    getTaskPriority: async (taskId: string): Promise<number | null> => {
      const result = await queryFn('SELECT priority FROM tasks WHERE id = $1', [
        taskId,
      ]);
      return (result.rows[0] as { priority: number })?.priority || null;
    },

    /**
     * Get priorities of adjacent tasks for efficient reordering
     */
    getAdjacentTaskPriorities: async (
      userId: number,
      afterTaskId?: string,
      beforeTaskId?: string
    ): Promise<{ afterPriority?: number; beforePriority?: number }> => {
      if (!afterTaskId && !beforeTaskId) {
        // Moving to beginning - get first task priority
        const result = await queryFn(
          'SELECT priority FROM tasks WHERE user_id = $1 ORDER BY priority ASC LIMIT 1',
          [userId]
        );
        return {
          beforePriority: (result.rows[0] as { priority: number })?.priority,
        };
      }

      if (afterTaskId && !beforeTaskId) {
        // Moving to end or after specific task - get that task and the next one
        const result = await queryFn(
          `SELECT id, priority, 
         LEAD(priority) OVER (ORDER BY priority ASC) as next_priority
         FROM tasks 
         WHERE user_id = $1 AND id = $2`,
          [userId, afterTaskId]
        );
        const row = result.rows[0] as {
          priority: number;
          next_priority: number;
        };
        return {
          afterPriority: row?.priority,
          beforePriority: row?.next_priority,
        };
      }

      if (!afterTaskId && beforeTaskId) {
        // Moving before specific task (could be moving to the very top)
        const result = await queryFn(
          `SELECT id, priority,
         LAG(priority) OVER (ORDER BY priority ASC) as prev_priority
         FROM tasks 
         WHERE user_id = $1 AND id = $2`,
          [userId, beforeTaskId]
        );
        const row = result.rows[0] as {
          priority: number;
          prev_priority: number;
        };
        return {
          afterPriority: row?.prev_priority || undefined,
          beforePriority: row?.priority,
        };
      }

      // Moving between two specific tasks
      const result = await queryFn(
        'SELECT id, priority FROM tasks WHERE user_id = $1 AND id IN ($2, $3)',
        [userId, afterTaskId, beforeTaskId]
      );

      const afterTask = (
        result.rows as { id: string; priority: number }[]
      ).find((r) => r.id === afterTaskId);
      const beforeTask = (
        result.rows as { id: string; priority: number }[]
      ).find((r) => r.id === beforeTaskId);

      return {
        afterPriority: afterTask?.priority,
        beforePriority: beforeTask?.priority,
      };
    },

    /**
     * Calculate new priority for a task relative to a reference task
     */
    calculateNewPriority: async (
      userId: number,
      taskId: string,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<number | null> => {
      // Get the reference task priority
      const referenceResult = await queryFn(
        'SELECT priority FROM tasks WHERE id = $1 AND user_id = $2',
        [referenceTaskId, userId]
      );

      if (!referenceResult.rows[0]) {
        return null;
      }

      const referencePriority = (
        referenceResult.rows[0] as { priority: number }
      ).priority;

      if (position === 'above') {
        // To place above the reference task, find the task immediately before it
        const beforeResult = await queryFn(
          `SELECT priority FROM tasks 
         WHERE user_id = $1 AND priority < $2 AND id != $3
         ORDER BY priority DESC LIMIT 1`,
          [userId, referencePriority, taskId]
        );

        if (beforeResult.rows[0]) {
          // Place between the before task and reference task
          const beforePriority = (beforeResult.rows[0] as { priority: number })
            .priority;
          return (beforePriority + referencePriority) / 2;
        } else {
          // No task before reference - place at the very beginning
          return referencePriority - 1000;
        }
      } else {
        // position === 'below'
        // To place below the reference task, find the task immediately after it
        const afterResult = await queryFn(
          `SELECT priority FROM tasks 
         WHERE user_id = $1 AND priority > $2 AND id != $3
         ORDER BY priority ASC LIMIT 1`,
          [userId, referencePriority, taskId]
        );

        if (afterResult.rows[0]) {
          // Place between reference task and the task after it
          const afterPriority = (afterResult.rows[0] as { priority: number })
            .priority;
          return (referencePriority + afterPriority) / 2;
        } else {
          // No task after reference - place at the very end
          return referencePriority + 1000;
        }
      }
    },

    /**
     * Calculate new priority for a task relative to a reference task, considering only pending tasks
     * This ensures that completed tasks do not interfere with pending task ordering
     * Uses a single query to avoid concurrency issues
     */
    calculateNewPriorityForPendingTasks: async (
      userId: number,
      taskId: string,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<number | null> => {
      const result = await queryFn(
        `WITH reference_task AS (
        SELECT priority as ref_priority
        FROM tasks
        WHERE id = $2 AND user_id = $1
      ),
      adjacent_priority AS (
        SELECT 
          CASE 
            WHEN $4 = 'above' THEN 
              (SELECT priority FROM tasks 
               WHERE user_id = $1 AND completed = false AND id != $3 
                 AND priority < (SELECT ref_priority FROM reference_task)
               ORDER BY priority DESC LIMIT 1)
            ELSE 
              (SELECT priority FROM tasks 
               WHERE user_id = $1 AND completed = false AND id != $3 
                 AND priority > (SELECT ref_priority FROM reference_task)
               ORDER BY priority ASC LIMIT 1)
          END as adj_priority
      )
      SELECT 
        ref_priority,
        adj_priority,
        CASE 
          WHEN adj_priority IS NOT NULL THEN 
            (ref_priority + adj_priority) / 2.0
          WHEN $4 = 'above' THEN 
            ref_priority - 1000
          ELSE 
            ref_priority + 1000
        END as new_priority
      FROM reference_task, adjacent_priority`,
        [userId, referenceTaskId, taskId, position]
      );

      if (
        !result.rows[0] ||
        (result.rows[0] as { ref_priority: number }).ref_priority === null
      ) {
        return null;
      }

      return (result.rows[0] as { new_priority: number }).new_priority;
    },

    // ===== REFERENCE TASK METHODS =====

    /**
     * Upsert a reference task - create if doesn't exist, update if it does
     * Uses atomic operation to prevent race conditions
     * Calculates next_scheduled_date in the same query for optimal performance
     */
    upsertReferenceTask: async (
      referenceTaskData: CreateReferenceTask & { id?: string }
    ): Promise<ReferenceTask> => {
      const params = [
        referenceTaskData.user_id,
        referenceTaskData.journal_id,
        referenceTaskData.title,
        referenceTaskData.description || null,
        referenceTaskData.recurrence_type,
        Number(referenceTaskData.recurrence_interval) || 1,
        referenceTaskData.recurrence_days_of_week || null,
        referenceTaskData.recurrence_day_of_month
          ? Number(referenceTaskData.recurrence_day_of_month)
          : null,
        referenceTaskData.recurrence_week_of_month
          ? Number(referenceTaskData.recurrence_week_of_month)
          : null,
        referenceTaskData.starts_on,
        referenceTaskData.ends_on || null,
        referenceTaskData.is_active !== undefined
          ? referenceTaskData.is_active
          : true,
      ];

      let sql: string;

      if (referenceTaskData.id) {
        params.push(referenceTaskData.id);
        sql = `INSERT INTO reference_tasks (
        id, user_id, journal_id, title, description, recurrence_type, recurrence_interval,
        recurrence_days_of_week, recurrence_day_of_month, recurrence_week_of_month,
        starts_on, ends_on, is_active, next_scheduled_date
      ) VALUES (
        $13, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        calculate_next_scheduled_date($5::recurrence_type_enum, $6::SMALLINT, $7::SMALLINT[], $8::SMALLINT, $10::DATE, $11::DATE, CURRENT_DATE)
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        recurrence_type = EXCLUDED.recurrence_type,
        recurrence_interval = EXCLUDED.recurrence_interval,
        recurrence_days_of_week = EXCLUDED.recurrence_days_of_week,
        recurrence_day_of_month = EXCLUDED.recurrence_day_of_month,
        recurrence_week_of_month = EXCLUDED.recurrence_week_of_month,
        starts_on = EXCLUDED.starts_on,
        ends_on = EXCLUDED.ends_on,
        is_active = EXCLUDED.is_active,
        next_scheduled_date = calculate_next_scheduled_date(
          EXCLUDED.recurrence_type,
          EXCLUDED.recurrence_interval,
          EXCLUDED.recurrence_days_of_week,
          EXCLUDED.recurrence_day_of_month,
          EXCLUDED.starts_on,
          EXCLUDED.ends_on,
          CURRENT_DATE
        ),
        updated_at = NOW()
      RETURNING *`;
      } else {
        sql = `INSERT INTO reference_tasks (
        user_id, journal_id, title, description, recurrence_type, recurrence_interval,
        recurrence_days_of_week, recurrence_day_of_month, recurrence_week_of_month,
        starts_on, ends_on, is_active, next_scheduled_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        calculate_next_scheduled_date($5::recurrence_type_enum, $6::SMALLINT, $7::SMALLINT[], $8::SMALLINT, $10::DATE, $11::DATE, CURRENT_DATE)
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        recurrence_type = EXCLUDED.recurrence_type,
        recurrence_interval = EXCLUDED.recurrence_interval,
        recurrence_days_of_week = EXCLUDED.recurrence_days_of_week,
        recurrence_day_of_month = EXCLUDED.recurrence_day_of_month,
        recurrence_week_of_month = EXCLUDED.recurrence_week_of_month,
        starts_on = EXCLUDED.starts_on,
        ends_on = EXCLUDED.ends_on,
        is_active = EXCLUDED.is_active,
        next_scheduled_date = calculate_next_scheduled_date(
          EXCLUDED.recurrence_type,
          EXCLUDED.recurrence_interval,
          EXCLUDED.recurrence_days_of_week,
          EXCLUDED.recurrence_day_of_month,
          EXCLUDED.starts_on,
          EXCLUDED.ends_on,
          CURRENT_DATE
        ),
        updated_at = NOW()
      RETURNING *`;
      }

      const result = await queryFn(sql, params);
      return result.rows[0] as ReferenceTask;
    },

    /**
     * Find all reference tasks for a user
     */
    findReferenceTasksByUserId: async (
      userId: number
    ): Promise<ReferenceTask[]> => {
      const result = await queryFn(
        'SELECT * FROM reference_tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows as ReferenceTask[];
    },

    /**
     * Find a reference task by ID
     */
    findReferenceTaskById: async (
      id: string
    ): Promise<ReferenceTask | null> => {
      const result = await queryFn(
        'SELECT * FROM reference_tasks WHERE id = $1',
        [id]
      );
      return (result.rows[0] as ReferenceTask) || null;
    },

    /**
     * Get reference tasks that need tasks created for a specific date (for a specific user)
     * This is optimized using the next_scheduled_date index
     */
    getReferenceTasksDueForUser: async (
      userId: number,
      targetDate: Date
    ): Promise<ReferenceTask[]> => {
      const result = await queryFn(
        `SELECT * FROM reference_tasks 
       WHERE user_id = $1 
       AND is_active = true 
       AND next_scheduled_date = $2::date`,
        [userId, targetDate]
      );
      return result.rows as ReferenceTask[];
    },

    /**
     * Get all reference tasks that need tasks created for a specific date (across all users)
     * This is optimized using the next_scheduled_date index
     */
    getReferenceTasksDueForDate: async (
      targetDate: Date
    ): Promise<ReferenceTask[]> => {
      const result = await queryFn(
        `SELECT * FROM reference_tasks 
       WHERE is_active = true 
       AND next_scheduled_date = $1::date
       ORDER BY user_id`,
        [targetDate]
      );
      return result.rows as ReferenceTask[];
    },

    /**
     * Create tasks from reference tasks for a specific date (SQL-based, per user)
     * This does all the work in SQL and returns the count of tasks created
     */
    createTasksFromReferenceTasksForUser: async (
      userId: number,
      targetDate: Date
    ): Promise<{ tasks_created: string; tasks_skipped: string }> => {
      const result = await queryFn(
        `
      WITH eligible_reference_tasks AS (
        SELECT * FROM reference_tasks 
        WHERE user_id = $1 
        AND is_active = true 
        AND next_scheduled_date = $2::date
      ),
      tasks_to_create AS (
        SELECT 
          rt.id as reference_task_id,
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          $2::date as scheduled_date,
          COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = rt.user_id), 0) + 1000 as priority
        FROM eligible_reference_tasks rt
        WHERE NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.reference_task_id = rt.id 
          AND t.scheduled_date::date = $2::date
        )
      ),
      inserted_tasks AS (
        INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
        )
        SELECT 
          journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
        FROM tasks_to_create
        RETURNING reference_task_id
      ),
      updated_reference_tasks AS (
        UPDATE reference_tasks 
        SET next_scheduled_date = calculate_next_scheduled_date(
          recurrence_type,
          recurrence_interval,
          recurrence_days_of_week,
          recurrence_day_of_month,
          starts_on,
          ends_on,
          ($2::date + INTERVAL '1 day')::date
        )
        WHERE id IN (SELECT reference_task_id FROM inserted_tasks)
        RETURNING id
      )
      SELECT 
        (SELECT COUNT(*) FROM inserted_tasks) as tasks_created,
        (SELECT COUNT(*) FROM eligible_reference_tasks) - (SELECT COUNT(*) FROM inserted_tasks) as tasks_skipped
      `,
        [userId, targetDate]
      );

      return (
        (result.rows[0] as {
          tasks_created: string;
          tasks_skipped: string;
        }) || { tasks_created: '0', tasks_skipped: '0' }
      );
    },

    /**
     * Create tasks from reference tasks for a specific date (SQL-based, all users)
     * This does all the work in SQL and returns detailed results
     */
    createTasksFromReferenceTasksForDate: async (
      targetDate: Date
    ): Promise<{
      tasks_created: string;
      tasks_skipped: string;
      users_processed: string;
      reference_tasks_processed: string;
    }> => {
      const result = await queryFn(
        `
      WITH eligible_reference_tasks AS (
        SELECT * FROM reference_tasks 
        WHERE is_active = true 
        AND next_scheduled_date = $1::date
      ),
      tasks_to_create AS (
        SELECT 
          rt.id as reference_task_id,
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          $1::date as scheduled_date,
          COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = rt.user_id), 0) + 1000 as priority
        FROM eligible_reference_tasks rt
        WHERE NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.reference_task_id = rt.id 
          AND t.scheduled_date::date = $1::date
        )
      ),
      inserted_tasks AS (
        INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
        )
        SELECT 
          journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
        FROM tasks_to_create
        RETURNING reference_task_id
      ),
      updated_reference_tasks AS (
        UPDATE reference_tasks 
        SET next_scheduled_date = calculate_next_scheduled_date(
          recurrence_type,
          recurrence_interval,
          recurrence_days_of_week,
          recurrence_day_of_month,
          starts_on,
          ends_on,
          ($1::date + INTERVAL '1 day')::date
        )
        WHERE id IN (SELECT reference_task_id FROM inserted_tasks)
        RETURNING id
      )
      SELECT 
        (SELECT COUNT(*) FROM inserted_tasks) as tasks_created,
        (SELECT COUNT(*) FROM eligible_reference_tasks) - (SELECT COUNT(*) FROM inserted_tasks) as tasks_skipped,
        (SELECT COUNT(DISTINCT user_id) FROM eligible_reference_tasks) as users_processed,
        (SELECT COUNT(*) FROM eligible_reference_tasks) as reference_tasks_processed
      `,
        [targetDate]
      );

      return (
        (result.rows[0] as {
          tasks_created: string;
          tasks_skipped: string;
          users_processed: string;
          reference_tasks_processed: string;
        }) || {
          tasks_created: '0',
          tasks_skipped: '0',
          users_processed: '0',
          reference_tasks_processed: '0',
        }
      );
    },
  };

  return repository;
};

// Create the default instance using the default query function
export const taskRepository = createTaskRepository(query);
