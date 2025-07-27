import { query } from '../db';
import { Task, CreateTask, UpdateTask } from '../models/Task';
import { ReferenceTask, CreateReferenceTask } from '../models/ReferenceTask';

export const taskRepository = {
  /**
   * Find all tasks for a user
   */
  findByUserId: async (userId: number): Promise<Task[]> => {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY priority ASC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Find all tasks for a specific journal
   */
  findByJournalId: async (journalId: string): Promise<Task[]> => {
    const result = await query(
      'SELECT * FROM tasks WHERE journal_id = $1 ORDER BY priority ASC',
      [journalId]
    );
    return result.rows;
  },

  /**
   * Find a task by ID
   */
  findById: async (id: string): Promise<Task | null> => {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new task
   */
  create: async (taskData: CreateTask): Promise<Task> => {
    const result = await query(
      `INSERT INTO tasks (
        journal_id, user_id, title, description, priority
      ) VALUES (
        $1, $2, $3, $4, 
        CASE 
          WHEN $5::INTEGER IS NOT NULL THEN $5::INTEGER
          ELSE COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $2), 0) + 1000
        END
      ) RETURNING *`,
      [
        taskData.journal_id,
        taskData.user_id,
        taskData.title,
        taskData.description || null,
        taskData.priority || null,
      ]
    );
    return result.rows[0];
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
      return await taskRepository.findById(id);
    }

    sets.push(`updated_at = NOW()`);

    values.push(id);
    const result = await query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a task
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [
      id,
    ]);
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
    const result = await query(
      'UPDATE tasks SET priority = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [priority, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Get tasks by user with priority range for calculating new priorities
   */
  getTasksForReordering: async (userId: number): Promise<Task[]> => {
    const result = await query(
      'SELECT id, priority FROM tasks WHERE user_id = $1 ORDER BY priority ASC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Get priority of a specific task
   */
  getTaskPriority: async (taskId: string): Promise<number | null> => {
    const result = await query('SELECT priority FROM tasks WHERE id = $1', [
      taskId,
    ]);
    return result.rows[0]?.priority || null;
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
      const result = await query(
        'SELECT priority FROM tasks WHERE user_id = $1 ORDER BY priority ASC LIMIT 1',
        [userId]
      );
      return { beforePriority: result.rows[0]?.priority };
    }

    if (afterTaskId && !beforeTaskId) {
      // Moving to end or after specific task - get that task and the next one
      const result = await query(
        `SELECT id, priority, 
         LEAD(priority) OVER (ORDER BY priority ASC) as next_priority
         FROM tasks 
         WHERE user_id = $1 AND id = $2`,
        [userId, afterTaskId]
      );
      const row = result.rows[0];
      return {
        afterPriority: row?.priority,
        beforePriority: row?.next_priority,
      };
    }

    if (!afterTaskId && beforeTaskId) {
      // Moving before specific task (could be moving to the very top)
      const result = await query(
        `SELECT id, priority,
         LAG(priority) OVER (ORDER BY priority ASC) as prev_priority
         FROM tasks 
         WHERE user_id = $1 AND id = $2`,
        [userId, beforeTaskId]
      );
      const row = result.rows[0];
      return {
        afterPriority: row?.prev_priority || undefined,
        beforePriority: row?.priority,
      };
    }

    // Moving between two specific tasks
    const result = await query(
      'SELECT id, priority FROM tasks WHERE user_id = $1 AND id IN ($2, $3)',
      [userId, afterTaskId, beforeTaskId]
    );

    const afterTask = result.rows.find((r) => r.id === afterTaskId);
    const beforeTask = result.rows.find((r) => r.id === beforeTaskId);

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
    const referenceResult = await query(
      'SELECT priority FROM tasks WHERE id = $1 AND user_id = $2',
      [referenceTaskId, userId]
    );

    if (!referenceResult.rows[0]) {
      return null;
    }

    const referencePriority = referenceResult.rows[0].priority;

    if (position === 'above') {
      // To place above the reference task, find the task immediately before it
      const beforeResult = await query(
        `SELECT priority FROM tasks 
         WHERE user_id = $1 AND priority < $2 AND id != $3
         ORDER BY priority DESC LIMIT 1`,
        [userId, referencePriority, taskId]
      );

      if (beforeResult.rows[0]) {
        // Place between the before task and reference task
        const beforePriority = beforeResult.rows[0].priority;
        return (beforePriority + referencePriority) / 2;
      } else {
        // No task before reference - place at the very beginning
        return referencePriority - 1000;
      }
    } else {
      // position === 'below'
      // To place below the reference task, find the task immediately after it
      const afterResult = await query(
        `SELECT priority FROM tasks 
         WHERE user_id = $1 AND priority > $2 AND id != $3
         ORDER BY priority ASC LIMIT 1`,
        [userId, referencePriority, taskId]
      );

      if (afterResult.rows[0]) {
        // Place between reference task and the task after it
        const afterPriority = afterResult.rows[0].priority;
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
    const result = await query(
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

    if (!result.rows[0] || result.rows[0].ref_priority === null) {
      return null;
    }

    return result.rows[0].new_priority;
  },

  // ===== REFERENCE TASK METHODS =====

  /**
   * Upsert a reference task - create if doesn't exist, update if it does
   * Uses atomic operation to prevent race conditions
   */
  upsertReferenceTask: async (
    referenceTaskData: CreateReferenceTask & { id?: string }
  ): Promise<ReferenceTask> => {
    const result = await query(
      `INSERT INTO reference_tasks (
        ${referenceTaskData.id ? 'id,' : ''}
        user_id, journal_id, title, description, recurrence_type, recurrence_interval,
        recurrence_days_of_week, recurrence_day_of_month, recurrence_week_of_month,
        starts_on, ends_on
      ) VALUES (
        ${referenceTaskData.id ? '$12,' : ''}
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
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
        updated_at = NOW()
      RETURNING *`,
      referenceTaskData.id
        ? [
            referenceTaskData.user_id,
            referenceTaskData.journal_id,
            referenceTaskData.title,
            referenceTaskData.description || null,
            referenceTaskData.recurrence_type,
            referenceTaskData.recurrence_interval || 1,
            referenceTaskData.recurrence_days_of_week || null,
            referenceTaskData.recurrence_day_of_month || null,
            referenceTaskData.recurrence_week_of_month || null,
            referenceTaskData.starts_on,
            referenceTaskData.ends_on || null,
            referenceTaskData.id,
          ]
        : [
            referenceTaskData.user_id,
            referenceTaskData.journal_id,
            referenceTaskData.title,
            referenceTaskData.description || null,
            referenceTaskData.recurrence_type,
            referenceTaskData.recurrence_interval || 1,
            referenceTaskData.recurrence_days_of_week || null,
            referenceTaskData.recurrence_day_of_month || null,
            referenceTaskData.recurrence_week_of_month || null,
            referenceTaskData.starts_on,
            referenceTaskData.ends_on || null,
          ]
    );
    return result.rows[0];
  },

  /**
   * Insert a new task from reference task
   * Uses atomic operation to create task with default priority
   */
  insertTaskFromReferenceTask: async (
    referenceTask: ReferenceTask,
    scheduledDate: Date
  ): Promise<Task> => {
    const result = await query(
      `INSERT INTO tasks (
        journal_id, user_id, title, description, priority, reference_task_id, scheduled_date
      ) VALUES (
        $1, $2, $3, $4, 
        COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $2), 0) + 1000,
        $5, $6
      )
      WHERE NOT EXISTS (
        SELECT 1 FROM tasks 
        WHERE reference_task_id = $5 AND scheduled_date = $6
      )
      RETURNING *`,
      [
        referenceTask.journal_id,
        referenceTask.user_id,
        referenceTask.title,
        referenceTask.description || null,
        referenceTask.id,
        scheduledDate,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Task already exists for this reference task and date');
    }

    return result.rows[0];
  },

  /**
   * Update an existing task from reference task
   * Updates title and description only, preserves priority and other fields
   */
  updateTaskFromReferenceTask: async (
    taskId: string,
    referenceTask: ReferenceTask
  ): Promise<Task | null> => {
    const result = await query(
      `UPDATE tasks 
       SET title = $2,
           description = $3,
           updated_at = NOW()
       WHERE id = $1 AND reference_task_id = $4
       RETURNING *`,
      [
        taskId,
        referenceTask.title,
        referenceTask.description || null,
        referenceTask.id,
      ]
    );

    return result.rows[0] || null;
  },

  /**
   * Find all reference tasks for a user
   */
  findReferenceTasksByUserId: async (
    userId: number
  ): Promise<ReferenceTask[]> => {
    const result = await query(
      'SELECT * FROM reference_tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Find a reference task by ID
   */
  findReferenceTaskById: async (id: string): Promise<ReferenceTask | null> => {
    const result = await query('SELECT * FROM reference_tasks WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  },
};
