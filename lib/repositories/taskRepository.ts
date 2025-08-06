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
          WHERE th.level < 3  -- Prevent infinite recursion, max 3 levels
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
        journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date, parent_task_id
      ) VALUES (
        $1, $2, $3, $4, 
        CASE 
          WHEN $5::INTEGER IS NOT NULL THEN $5::INTEGER
          ELSE COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $2), 0) + 1000
        END,
        $6, $7, $8, $9
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
        `INSERT INTO tasks (journal_id, user_id, title, description, priority)
         SELECT $2, $1, $3, $4, COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $1), 0) + 1000
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
            COALESCE(
              (WITH RECURSIVE task_depth AS (
                SELECT t.id, 0 as depth
                FROM tasks t
                WHERE t.id = $2
                UNION ALL
                SELECT p.id, td.depth + 1
                FROM tasks p
                JOIN task_depth td ON p.parent_task_id = td.id
                WHERE td.depth < 10
              )
              SELECT MAX(depth) FROM task_depth), 0
            ) as current_depth
          FROM tasks t
          WHERE t.id = $2 AND t.user_id = $1
        )
        INSERT INTO tasks (
          journal_id, user_id, title, description, priority, parent_task_id
        )
        SELECT 
          pv.journal_id,
          $1,
          $3,
          $4,
          COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = $1), 0) + 1000,
          $2
        FROM parent_validation pv
        WHERE pv.id IS NOT NULL AND pv.current_depth < 2
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
        -- Calculate depth for each task
        task_depths AS (
          SELECT 
            t.id, 
            t.parent_task_id,
            CASE 
              WHEN t.parent_task_id IS NULL THEN 0
              ELSE (
                WITH RECURSIVE depth_calc AS (
                  SELECT id, parent_task_id, 0 as depth
                  FROM tasks 
                  WHERE id = t.id
                  UNION ALL
                  SELECT p.id, p.parent_task_id, dc.depth + 1
                  FROM tasks p
                  JOIN depth_calc dc ON p.id = dc.parent_task_id
                  WHERE dc.depth < 10
                )
                SELECT MAX(depth) FROM depth_calc
              )
            END as depth
          FROM tasks t
          WHERE t.user_id = $2
        ),
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
        JOIN task_depths td ON t.id = td.id
        WHERE t.user_id = $2
        AND t.id != $1  -- Can't be parent of itself
        AND t.id NOT IN (SELECT id FROM task_descendants WHERE id != $1)  -- Avoid cycles
        AND td.depth < 2  -- Not at max depth
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
     * Complete a task only if it has no incomplete child tasks
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
      // If uncompleting, skip validation
      if (!completed) {
        const updateResult = await queryFn(
          'UPDATE tasks SET completed = $1, completed_at = NULL WHERE id = $2 RETURNING *',
          [completed, taskId]
        );
        const task = (updateResult.rows[0] as Task) || null;
        return { task, canComplete: true, incompleteChildren: [] };
      }

      // Check if task can be completed (no incomplete children)
      const childResult = await queryFn(
        'SELECT * FROM tasks WHERE parent_task_id = $1 AND completed = false ORDER BY priority ASC',
        [taskId]
      );

      const incompleteChildren = childResult.rows as Task[];

      if (incompleteChildren.length > 0) {
        return {
          task: null,
          canComplete: false,
          incompleteChildren,
          error: 'Cannot complete task while child tasks remain incomplete',
        };
      }

      // Complete the task
      const updateResult = await queryFn(
        'UPDATE tasks SET completed = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
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
          WHERE th.level < 3  -- Prevent infinite recursion, max 3 levels
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
          WHERE td.level < 3  -- Max 3 levels deep
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
      const insertResult = await queryFn(
        `INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date
        )
        SELECT 
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = rt.user_id), 0) + 1000 as priority,
          rt.id,
          rt.recurrence_type,
          $2::date
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
      const insertResult = await queryFn(
        `INSERT INTO tasks (
          journal_id, user_id, title, description, priority, reference_task_id, recurrence_type, scheduled_date
        )
        SELECT 
          rt.journal_id,
          rt.user_id,
          rt.title,
          rt.description,
          COALESCE((SELECT MAX(priority) FROM tasks WHERE user_id = rt.user_id), 0) + 1000 as priority,
          rt.id,
          rt.recurrence_type,
          $1::date
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
     * This handles the entire hierarchical reorder operation atomically
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
        // First, get the new priority for the parent task
        const newPriorityResult = await queryFn(
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

        if (!newPriorityResult.rows[0]) {
          await queryFn('ROLLBACK');
          return null;
        }

        const newPriority = (
          newPriorityResult.rows[0] as { new_priority: number }
        ).new_priority;

        // Update the parent task priority
        const parentResult = await queryFn(
          'UPDATE tasks SET priority = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [newPriority, taskId]
        );

        const parentTask = (parentResult.rows[0] as Task) || null;
        if (!parentTask) {
          await queryFn('ROLLBACK');
          return null;
        }

        // If there are descendants, update their priorities in a batch
        if (descendantIds && descendantIds.length > 0) {
          // Calculate the proper spacing to ensure descendants fit between parent and adjacent task
          const adjacentPriority = (
            newPriorityResult.rows[0] as {
              ref_priority: number;
              adj_priority: number | null;
            }
          ).adj_priority;

          let priorityOffsets: number[];

          if (adjacentPriority !== null) {
            // We have an adjacent task, so we need to fit all descendants between parent and adjacent
            const availableSpace = adjacentPriority - newPriority;
            const increment = availableSpace / (descendantIds.length + 1);
            priorityOffsets = descendantIds.map(
              (_, index) => increment * (index + 1)
            );
          } else {
            // No adjacent task, so we can use simple increments
            priorityOffsets = descendantIds.map(
              (_, index) => (index + 1) * 100
            );
          }

          const descendantIdsArray = descendantIds;

          await queryFn(
            `UPDATE tasks 
             SET priority = $1 + priority_offset, updated_at = NOW()
             FROM UNNEST($2::uuid[], $3::numeric[]) AS t(id, priority_offset)
             WHERE tasks.id = t.id`,
            [newPriority, descendantIdsArray, priorityOffsets]
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
      let whereClause = 'WHERE t.user_id = $1';
      const params: (number | boolean)[] = [userId];

      if (filters?.completed !== undefined) {
        whereClause += ` AND t.completed = $${params.length + 1}`;
        params.push(filters.completed);
      }

      const result = await queryFn(
        `WITH RECURSIVE task_hierarchy AS (
          -- Start with top-level tasks (no parent)
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
            0 as level, 
            ARRAY[
              -- First sort by bucket priority (reference tasks before regular)
              CASE WHEN t.recurrence_type IS NOT NULL THEN t.recurrence_type ELSE 999 END,
              -- Then by task priority within bucket
              t.priority
            ] as sort_path
          FROM tasks t
          ${whereClause} AND t.parent_task_id IS NULL
          
          UNION ALL
          
          -- Recursively find children
          SELECT 
            t.*,
            th.task_bucket, -- Children inherit parent's bucket
            th.level + 1,
            th.sort_path || t.priority
          FROM tasks t
          INNER JOIN task_hierarchy th ON t.parent_task_id = th.id
          WHERE th.level < 3  -- Prevent infinite recursion, max 3 levels
        )
        SELECT * FROM task_hierarchy 
        ORDER BY sort_path`,
        params
      );

      return result.rows as BucketedTask[];
    },
  };

  return repository;
};

// Create the default instance using the default query function
export const taskRepository = createTaskRepository(query);
