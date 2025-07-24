import { query } from '../db';
import { Task, CreateTask, UpdateTask } from '../models/Task';

export const taskRepository = {
  /**
   * Find all tasks for a user
   */
  findByUserId: async (userId: number): Promise<Task[]> => {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Find all tasks for a specific journal
   */
  findByJournalId: async (journalId: string): Promise<Task[]> => {
    const result = await query(
      'SELECT * FROM tasks WHERE journal_id = $1 ORDER BY created_at DESC',
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
        journal_id, user_id, title, description
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        taskData.journal_id,
        taskData.user_id,
        taskData.title,
        taskData.description || null,
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
};
