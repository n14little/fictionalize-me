import { query } from '../db';
import { QueryFunction } from '../db/types';
import { Task, CreateTask, UpdateTask, BucketedTask } from '../models/Task';
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
     * Find all tasks for a specific journal with hierarchical ordering
     * Returns tasks ordered by hierarchy (parent tasks followed by their children)
     */
    findByJournalIdHierarchical: async (journalId: string): Promise<Task[]> => {
      const result = await queryFn(
        `WITH RECURSIVE task_hierarchy AS (
          -- Start with top-level tasks (no parent)
          SELECT *, 0 as level, ARRAY[priority] as sort_path
          FROM tasks 
          WHERE journal_id = $1 AND parent_task_id IS NULL
          
          UNION ALL
          
          -- Recursively find children
          SELECT t.*, th.level + 1, th.sort_path || t.priority
          FROM tasks t
          INNER JOIN task_hierarchy th ON t.parent_task_id = th.id
        )
        SELECT * FROM task_hierarchy 
        ORDER BY sort_path`,
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
          journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date, parent_task_id, missed_at
        ) VALUES (
          $1, $2, $3, $4, 
          COALESCE($5, calculate_next_priority($2)), 
          $6, $7, $8, $9,
          calculate_missed_date(
            NOW(),
            COALESCE($7::SMALLINT, 6::SMALLINT),
            NULL::SMALLINT,
            NULL::SMALLINT[],
            NULL::SMALLINT,
            NULL::DATE,
            NULL::DATE,
            CURRENT_DATE
          )
        ) RETURNING *`,
        [
          taskData.journal_id,
          taskData.user_id,
          taskData.title,
          taskData.description || null,
          taskData.priority || null,
          taskData.reference_task_id || null,
          taskData.recurrence_type || null,
          taskData.scheduled_date || null,
          taskData.parent_task_id || null,
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

      if (taskData.parent_task_id !== undefined) {
        sets.push(`parent_task_id = $${paramIndex}`);
        values.push(taskData.parent_task_id);
        paramIndex++;
      }

      if (taskData.reference_task_id !== undefined) {
        sets.push(`reference_task_id = $${paramIndex}`);
        values.push(taskData.reference_task_id);
        paramIndex++;
      }

      if (taskData.recurrence_type !== undefined) {
        sets.push(`recurrence_type = $${paramIndex}`);
        values.push(taskData.recurrence_type);
        paramIndex++;
      }

      if (taskData.scheduled_date !== undefined) {
        sets.push(`scheduled_date = $${paramIndex}`);
        values.push(taskData.scheduled_date);
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
     * Delete a task with user validation in a single query
     * Returns true if deleted, false if not found or unauthorized
     */
    deleteWithUserValidation: async (
      id: string,
      userId: number
    ): Promise<boolean> => {
      const result = await queryFn(
        `DELETE FROM tasks 
         WHERE id = $1 
         AND id IN (
           SELECT t.id 
           FROM tasks t 
           JOIN journals j ON t.journal_id = j.id 
           WHERE j.user_id = $2
         ) 
         RETURNING id`,
        [id, userId]
      );
      return (result.rowCount ?? 0) > 0;
    },

    /**
     * Update a task with user validation in a single query
     * Returns the updated task if successful, null if not found or unauthorized
     */
    updateWithUserValidation: async (
      id: string,
      userId: number,
      taskData: UpdateTask
    ): Promise<Task | null> => {
      const sets = [];
      const values = [id, userId];
      let paramIndex = 3;

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
        values.push(taskData.completed ? 'true' : 'false');
        paramIndex++;

        if (taskData.completed) {
          sets.push(`completed_at = NOW()`);
        } else {
          sets.push(`completed_at = NULL`);
        }
      }

      if (sets.length === 0) {
        return null;
      }

      sets.push(`updated_at = NOW()`);

      const result = await queryFn(
        `UPDATE tasks 
         SET ${sets.join(', ')}
         WHERE id = $1 
         AND id IN (
           SELECT t.id 
           FROM tasks t 
           JOIN journals j ON t.journal_id = j.id 
           WHERE j.user_id = $2
         )
         RETURNING *`,
        values
      );
      return (result.rows[0] as Task) || null;
    },

    /**
     * Create a task with journal validation in a single query
     * Returns the created task if successful, null if journal not found or unauthorized
     */
    createWithJournalValidation: async (
      userId: number,
      journalId: string,
      title: string,
      description?: string
    ): Promise<Task | null> => {
      const result = await queryFn(
        `INSERT INTO tasks (journal_id, user_id, title, description, priority, missed_at)
         SELECT $2, $1, $3, $4, calculate_next_priority($1),
           calculate_missed_date(
             NOW(),
             6::SMALLINT,
             NULL::SMALLINT,
             NULL::SMALLINT[],
             NULL::SMALLINT,
             NULL::DATE,
             NULL::DATE,
             CURRENT_DATE
           )
         FROM journals j
         WHERE j.id = $2 AND j.user_id = $1
         RETURNING *`,
        [userId, journalId, title, description || null]
      );
      return (result.rows[0] as Task) || null;
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
     * Create a sub-task with validation in a single query
     * Returns null if validation fails, otherwise returns the created task
     * Sub-tasks inherit recurrence_type and reference_task_id from parent for bucket consistency
     */
    createSubTaskWithValidation: async (
      userId: number,
      parentId: string,
      title: string,
      description?: string
    ): Promise<Task | null> => {
      const result = await queryFn(
        `WITH parent_validation AS (
          SELECT 
            t.id,
            t.user_id,
            t.journal_id,
            t.recurrence_type,
            t.reference_task_id
          FROM tasks t
          WHERE t.id = $2 AND t.user_id = $1
        )
        INSERT INTO tasks (
          journal_id, user_id, title, description, priority, parent_task_id, recurrence_type, reference_task_id, missed_at
        )
        SELECT 
          pv.journal_id,
          $1,
          $3,
          $4,
          calculate_subtask_priority($1, $2, 'end'),
          $2,
          pv.recurrence_type,
          pv.reference_task_id,
          calculate_missed_date(
            NOW(),
            COALESCE(pv.recurrence_type, 6)::SMALLINT,
            NULL::SMALLINT,
            NULL::SMALLINT[],
            NULL::SMALLINT,
            NULL::DATE,
            NULL::DATE,
            CURRENT_DATE
          )
        FROM parent_validation pv
        WHERE pv.id IS NOT NULL
        RETURNING *`,
        [userId, parentId, title, description || null]
      );
      return (result.rows[0] as Task) || null;
    },

    /**
     * Get valid parent tasks for a given task in a single query
     */
    getValidParentTasksForTask: async (
      taskId: string,
      userId: number
    ): Promise<Task[]> => {
      const result = await queryFn(
        `WITH RECURSIVE 
        -- Get all descendants of the target task to avoid cycles
        task_descendants AS (
          SELECT $1::uuid as id
          UNION ALL
          SELECT t.id
          FROM tasks t
          JOIN task_descendants td ON t.parent_task_id = td.id
        )
        SELECT t.*
        FROM tasks t
        WHERE t.user_id = $2
        AND t.id != $1  -- Can't be parent of itself
        AND t.id NOT IN (SELECT id FROM task_descendants WHERE id != $1)  -- Avoid cycles
        ORDER BY t.title`,
        [taskId, userId]
      );
      return result.rows as Task[];
    },

    /**
     * Complete a task and return completion info with sub-task status in one query
     */
    completeTaskWithSubTaskInfo: async (
      taskId: string,
      completed: boolean
    ): Promise<{
      task: Task | null;
      hasIncompleteSubTasks: boolean;
      incompleteSubTasks: Task[];
    }> => {
      // First update the task
      const updateResult = await queryFn(
        'UPDATE tasks SET completed = $1, completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END WHERE id = $2 RETURNING *',
        [completed, taskId]
      );

      const task = (updateResult.rows[0] as Task) || null;

      if (!task || !completed) {
        return { task, hasIncompleteSubTasks: false, incompleteSubTasks: [] };
      }

      // Get incomplete sub-tasks in one query
      const subTaskResult = await queryFn(
        'SELECT * FROM tasks WHERE parent_task_id = $1 AND completed = false ORDER BY priority ASC',
        [taskId]
      );

      const incompleteSubTasks = subTaskResult.rows as Task[];

      return {
        task,
        hasIncompleteSubTasks: incompleteSubTasks.length > 0,
        incompleteSubTasks,
      };
    },

    /**
     * Check if a task can be completed (no incomplete child tasks)
     */
    canCompleteTask: async (
      taskId: string
    ): Promise<{
      canComplete: boolean;
      incompleteChildren: Task[];
    }> => {
      const result = await queryFn(
        'SELECT * FROM tasks WHERE parent_task_id = $1 AND completed = false ORDER BY priority ASC',
        [taskId]
      );

      const incompleteChildren = result.rows as Task[];

      return {
        canComplete: incompleteChildren.length === 0,
        incompleteChildren,
      };
    },

    /**
     * Complete a task (simplified - no child task validation)
     */
    completeTaskWithValidation: async (
      taskId: string,
      completed: boolean
    ): Promise<{
      task: Task | null;
      canComplete: boolean;
      incompleteChildren: Task[];
      error?: string;
    }> => {
      // Simply update the task completion status
      const updateResult = await queryFn(
        `UPDATE tasks 
         SET completed = $1, completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END 
         WHERE id = $2 
         RETURNING *`,
        [completed, taskId]
      );

      const task = (updateResult.rows[0] as Task) || null;

      return {
        task,
        canComplete: true,
        incompleteChildren: [],
      };
    },

    /**
     * Toggle task completion with user validation in optimized queries
     * Gets current state and performs completion toggle with validation
     */
    toggleTaskCompletionWithUserValidation: async (
      taskId: string,
      userId: number
    ): Promise<{
      task: Task | null;
      canComplete: boolean;
      incompleteChildren: Task[];
      error?: string;
    }> => {
      // First, get current task state and validate user ownership in one query
      const taskResult = await queryFn(
        `SELECT t.*, j.user_id as journal_user_id
         FROM tasks t 
         JOIN journals j ON t.journal_id = j.id 
         WHERE t.id = $1 AND j.user_id = $2`,
        [taskId, userId]
      );

      const taskRow = taskResult.rows[0];
      if (!taskRow) {
        return {
          task: null,
          canComplete: false,
          incompleteChildren: [],
          error: 'Task not found or unauthorized',
        };
      }

      const currentTask = taskRow as Task;
      const newCompletedState = !currentTask.completed;

      // Use existing validation method directly
      return repository.completeTaskWithValidation(taskId, newCompletedState);
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
     * Uses database function for single-query operation
     */
    calculateNewPriority: async (
      userId: number,
      taskId: string,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<number | null> => {
      const result = await queryFn(
        'SELECT calculate_priority_relative_to_task($1, $2, $3, $4) as new_priority',
        [userId, referenceTaskId, position, taskId]
      );

      return (result.rows[0] as { new_priority: number })?.new_priority || null;
    },

    /**
     * Calculate new priority for a task relative to a reference task, considering only pending tasks
     * Uses database function for single-query operation with completion filtering
     */
    calculateNewPriorityForPendingTasks: async (
      userId: number,
      taskId: string,
      referenceTaskId: string,
      position: 'above' | 'below'
    ): Promise<number | null> => {
      const result = await queryFn(
        'SELECT calculate_priority_relative_to_task($1, $2, $3, $4, false) as new_priority',
        [userId, referenceTaskId, position, taskId]
      );

      return (result.rows[0] as { new_priority: number })?.new_priority || null;
    },

    // ===== TASK HIERARCHY METHODS =====

    /**
     * Find all direct children of a parent task
     */
    findByParentId: async (parentId: string): Promise<Task[]> => {
      const result = await queryFn(
        'SELECT * FROM tasks WHERE parent_task_id = $1 ORDER BY priority ASC',
        [parentId]
      );
      return result.rows as Task[];
    },

    /**
     * Find all tasks for a user with proper hierarchical ordering
     * Returns tasks ordered by hierarchy (parent tasks followed by their children)
     */
    findHierarchyByUserId: async (userId: number): Promise<Task[]> => {
      const result = await queryFn(
        `WITH RECURSIVE task_hierarchy AS (
          -- Start with top-level tasks (no parent)
          SELECT *, 0 as level, ARRAY[priority] as sort_path
          FROM tasks 
          WHERE user_id = $1 AND parent_task_id IS NULL
          
          UNION ALL
          
          -- Recursively find children
          SELECT t.*, th.level + 1, th.sort_path || t.priority
          FROM tasks t
          INNER JOIN task_hierarchy th ON t.parent_task_id = th.id
        )
        SELECT * FROM task_hierarchy 
        ORDER BY sort_path`,
        [userId]
      );
      return result.rows as Task[];
    },

    /**
     * Check if a task has any incomplete sub-tasks
     */
    hasIncompleteSubTasks: async (taskId: string): Promise<boolean> => {
      const result = await queryFn(
        `WITH RECURSIVE task_descendants AS (
          -- Start with direct children
          SELECT id, completed, 1 as level
          FROM tasks 
          WHERE parent_task_id = $1
          
          UNION ALL
          
          -- Recursively find all descendants
          SELECT t.id, t.completed, td.level + 1
          FROM tasks t
          INNER JOIN task_descendants td ON t.parent_task_id = td.id
        )
        SELECT 1 FROM task_descendants WHERE completed = false LIMIT 1`,
        [taskId]
      );

      return result.rows.length > 0;
    },

    /**
     * Promote all sub-tasks of a deleted parent to top-level
     */
    promoteSubTasksToTopLevel: async (parentId: string): Promise<void> => {
      await queryFn(
        'UPDATE tasks SET parent_task_id = NULL WHERE parent_task_id = $1',
        [parentId]
      );
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
        calculate_next_scheduled_date(int_to_recurrence_type_enum($5), $6::SMALLINT, $7::SMALLINT[], $8::SMALLINT, $10::DATE, $11::DATE, CURRENT_DATE)
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
          int_to_recurrence_type_enum(EXCLUDED.recurrence_type),
          EXCLUDED.recurrence_interval,
          EXCLUDED.recurrence_days_of_week,
          EXCLUDED.recurrence_day_of_month,
          EXCLUDED.starts_on,
          EXCLUDED.ends_on,
          GREATEST(EXCLUDED.starts_on, CURRENT_DATE)
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
        calculate_next_scheduled_date(int_to_recurrence_type_enum($5), $6::SMALLINT, $7::SMALLINT[], $8::SMALLINT, $10::DATE, $11::DATE, CURRENT_DATE)
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
          int_to_recurrence_type_enum(EXCLUDED.recurrence_type),
          EXCLUDED.recurrence_interval,
          EXCLUDED.recurrence_days_of_week,
          EXCLUDED.recurrence_day_of_month,
          EXCLUDED.starts_on,
          EXCLUDED.ends_on,
          GREATEST(EXCLUDED.starts_on, CURRENT_DATE)
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
      // Step 1: Get eligible reference tasks
      const eligibleTasksResult = await queryFn(
        `SELECT * FROM reference_tasks 
         WHERE user_id = $1 
         AND is_active = true 
         AND next_scheduled_date = $2::date`,
        [userId, targetDate]
      );

      const eligibleTasks = eligibleTasksResult.rows;

      if (eligibleTasks.length === 0) {
        return { tasks_created: '0', tasks_skipped: '0' };
      }

      // Step 2: Insert tasks for eligible reference tasks that don't already have tasks for this date
      // Use database function to calculate priorities automatically
      const insertResult = await queryFn(
        `INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date, missed_at
        )
        SELECT 
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          calculate_next_priority(rt.user_id) + (ROW_NUMBER() OVER (ORDER BY rt.id) - 1) * 10,
          rt.id,
          rt.recurrence_type,
          $2::date,
          calculate_missed_date(
            NOW(),
            rt.recurrence_type,
            rt.recurrence_interval,
            rt.recurrence_days_of_week,
            rt.recurrence_day_of_month,
            rt.starts_on,
            rt.ends_on,
            $2::date
          )
        FROM reference_tasks rt
        WHERE rt.user_id = $1 
        AND rt.is_active = true 
        AND rt.next_scheduled_date = $2::date
        AND NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.reference_task_id = rt.id 
          AND t.scheduled_date::date = $2::date
        )
        RETURNING reference_task_id`,
        [userId, targetDate]
      );

      const createdTasksCount = insertResult.rows.length;
      const skippedTasksCount = eligibleTasks.length - createdTasksCount;

      // Step 3: Update next_scheduled_date for reference tasks that had tasks created
      if (createdTasksCount > 0) {
        const referenceTaskIds = (
          insertResult.rows as { reference_task_id: string }[]
        ).map((row) => row.reference_task_id);
        await queryFn(
          `UPDATE reference_tasks 
           SET next_scheduled_date = calculate_next_scheduled_date(
             int_to_recurrence_type_enum(recurrence_type),
             recurrence_interval,
             recurrence_days_of_week,
             recurrence_day_of_month,
             starts_on,
             ends_on,
             ($2::date + INTERVAL '1 day')::date
           )
           WHERE id = ANY($1)`,
          [referenceTaskIds, targetDate]
        );
      }

      return {
        tasks_created: createdTasksCount.toString(),
        tasks_skipped: skippedTasksCount.toString(),
      };
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
      // Step 1: Get eligible reference tasks
      const eligibleTasksResult = await queryFn(
        `SELECT * FROM reference_tasks 
         WHERE is_active = true 
         AND next_scheduled_date = $1::date`,
        [targetDate]
      );

      const eligibleTasks = eligibleTasksResult.rows;

      if (eligibleTasks.length === 0) {
        return {
          tasks_created: '0',
          tasks_skipped: '0',
          users_processed: '0',
          reference_tasks_processed: '0',
        };
      }

      // Step 2: Insert tasks for eligible reference tasks that don't already have tasks for this date
      // Use database function to calculate priorities automatically with proper spacing per user
      const insertResult = await queryFn(
        `INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date, missed_at
        )
        SELECT
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          calculate_next_priority(rt.user_id) + (ROW_NUMBER() OVER (PARTITION BY rt.user_id ORDER BY rt.id) - 1) * 10,
          rt.id,
          rt.recurrence_type,
          $1::date,
          calculate_missed_date(
            NOW(),
            rt.recurrence_type,
            rt.recurrence_interval,
            rt.recurrence_days_of_week,
            rt.recurrence_day_of_month,
            rt.starts_on,
            rt.ends_on,
            $1::date
          )
        FROM reference_tasks rt
        WHERE rt.is_active = true 
        AND rt.next_scheduled_date = $1::date
        AND NOT EXISTS (
          SELECT 1 FROM tasks t 
          WHERE t.reference_task_id = rt.id 
          AND t.scheduled_date::date = $1::date
        )
        RETURNING reference_task_id`,
        [targetDate]
      );

      const createdTasksCount = insertResult.rows.length;
      const skippedTasksCount = eligibleTasks.length - createdTasksCount;

      // Step 3: Calculate users processed (distinct user_ids from eligible tasks)
      const usersProcessedResult = await queryFn(
        `SELECT COUNT(DISTINCT user_id) as count FROM reference_tasks 
         WHERE is_active = true AND next_scheduled_date = $1::date`,
        [targetDate]
      );
      const usersProcessed = (usersProcessedResult.rows[0] as { count: string })
        .count;

      // Step 4: Update next_scheduled_date for reference tasks that had tasks created
      if (createdTasksCount > 0) {
        const referenceTaskIds = (
          insertResult.rows as { reference_task_id: string }[]
        ).map((row) => row.reference_task_id);
        await queryFn(
          `UPDATE reference_tasks 
           SET next_scheduled_date = calculate_next_scheduled_date(
             int_to_recurrence_type_enum(recurrence_type),
             recurrence_interval,
             recurrence_days_of_week,
             recurrence_day_of_month,
             starts_on,
             ends_on,
             ($2::date + INTERVAL '1 day')::date
           )
           WHERE id = ANY($1)`,
          [referenceTaskIds, targetDate]
        );
      }

      return {
        tasks_created: createdTasksCount.toString(),
        tasks_skipped: skippedTasksCount.toString(),
        users_processed: usersProcessed,
        reference_tasks_processed: eligibleTasks.length.toString(),
      };
    },

    /**
     * Reorder a pending task with descendants in a single transaction
     * This handles the entire hierarchical reorder operation atomically using database functions
     */
    reorderPendingTaskWithDescendants: async (
      taskId: string,
      userId: number,
      referenceTaskId: string,
      position: 'above' | 'below',
      descendantIds?: string[]
    ): Promise<Task | null> => {
      // Use a transaction to ensure atomicity
      await queryFn('BEGIN');

      try {
        // Update the parent task priority using database function
        const parentResult = await queryFn(
          `UPDATE tasks 
           SET priority = calculate_priority_relative_to_task($2, $3, $4, $1, false),
               updated_at = NOW()
           WHERE id = $1 AND user_id = $2
           RETURNING *`,
          [taskId, userId, referenceTaskId, position]
        );

        const parentTask = (parentResult.rows[0] as Task) || null;
        if (!parentTask) {
          await queryFn('ROLLBACK');
          return null;
        }

        // If there are descendants, recalculate their priorities relative to the new parent position
        if (descendantIds && descendantIds.length > 0) {
          // Update all sub-task priorities to maintain proper spacing relative to the new parent position
          await queryFn(
            `WITH sub_tasks_ordered AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY priority ASC) as sub_order
              FROM tasks 
              WHERE parent_task_id = $1 
              ORDER BY priority ASC
            ),
            next_root_task AS (
              SELECT priority as next_priority
              FROM tasks 
              WHERE user_id = $2 
                AND parent_task_id IS NULL 
                AND priority > $3
              ORDER BY priority ASC 
              LIMIT 1
            ),
            priority_spacing AS (
              SELECT 
                COALESCE(
                  (SELECT next_priority FROM next_root_task), 
                  GREATEST($3 * 2, $3 + 1000)
                ) as next_boundary,
                $3 as parent_priority,
                (SELECT COUNT(*) FROM tasks WHERE parent_task_id = $1) as total_subtasks
            )
            UPDATE tasks 
            SET priority = ps.parent_priority + (sto.sub_order * ((ps.next_boundary - ps.parent_priority) / (ps.total_subtasks + 1))),
                updated_at = NOW()
            FROM sub_tasks_ordered sto, priority_spacing ps
            WHERE tasks.id = sto.id`,
            [taskId, userId, parentTask.priority]
          );
        }

        await queryFn('COMMIT');
        return parentTask;
      } catch (error) {
        await queryFn('ROLLBACK');
        throw error;
      }
    },

    /**
     * Find tasks for a user with bucketing information based on reference task recurrence type
     */
    findBucketedTasksByUserId: async (
      userId: number,
      filters?: { completed?: boolean }
    ): Promise<BucketedTask[]> => {
      let whereClause = 'WHERE user_id = $1';
      const params: (number | boolean)[] = [userId];

      if (filters?.completed !== undefined) {
        whereClause += ` AND completed = $${params.length + 1}`;
        params.push(filters.completed);
      }

      const result = await queryFn(
        `SELECT 
          *,
          CASE recurrence_type
            WHEN 1 THEN 'daily'
            WHEN 2 THEN 'weekly'
            WHEN 3 THEN 'monthly'
            WHEN 4 THEN 'yearly'
            WHEN 5 THEN 'custom'
            ELSE 'regular'
          END as task_bucket
        FROM tasks
        ${whereClause}
        ORDER BY 
          -- Direct integer ordering - no CASE statement needed!
          recurrence_type ASC,
          priority ASC`,
        params
      );

      return result.rows as BucketedTask[];
    },

    /**
     * Find tasks for a user with bucketing information AND hierarchical ordering
     * This preserves parent-child relationships within each bucket
     */
    findBucketedTasksByUserIdHierarchical: async (
      userId: number,
      filters?: { completed?: boolean }
    ): Promise<BucketedTask[]> => {
      const params: (number | boolean)[] = [userId];
      let filterClause = '';

      if (filters?.completed !== undefined) {
        params.push(filters.completed);
        filterClause = ` AND t.completed = $${params.length}`;
      }

      // Build hierarchy information for ALL tasks first, then filter while preserving order
      const result = await queryFn(
        `WITH RECURSIVE hierarchy_info AS (
          -- Get all top-level tasks with their sort path as text for proper ordering
          SELECT
            id, parent_task_id, 0 as level, 
            priority as root_priority
          FROM tasks
          WHERE parent_task_id IS NULL AND user_id = $1

          UNION ALL

          -- Recursively build hierarchy for ALL tasks
          SELECT
            t.id, t.parent_task_id, h.level + 1,
            h.root_priority
          FROM tasks t
          INNER JOIN hierarchy_info h ON t.parent_task_id = h.id
          WHERE t.user_id = $1
        )
        SELECT
          t.*,
          CASE t.recurrence_type
            WHEN 1 THEN 'daily'
            WHEN 2 THEN 'weekly'
            WHEN 3 THEN 'monthly'
            WHEN 4 THEN 'yearly'
            WHEN 5 THEN 'custom'
            ELSE 'regular'
          END as task_bucket,
          h.level
        FROM tasks t
        INNER JOIN hierarchy_info h ON t.id = h.id
        WHERE t.user_id = $1${filterClause}
        ORDER BY
          t.priority ASC`,
        params
      );

      return result.rows as BucketedTask[];
    },
  };

  return repository;
};

// Create the default instance using the default query function
export const taskRepository = createTaskRepository(query);
