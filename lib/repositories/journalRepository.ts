import { query } from '../db';
import { Journal, CreateJournal, UpdateJournal } from '../models/Journal';

export const journalRepository = {
  /**
   * Find all journals for a user
   */
  findByUserId: async (userId: number): Promise<Journal[]> => {
    const result = await query(
      'SELECT * FROM journals WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  },

  /**
   * Find a journal by ID
   */
  findById: async (id: string): Promise<Journal | null> => {
    const result = await query('SELECT * FROM journals WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Find a journal by slug
   */
  findBySlug: async (slug: string): Promise<Journal | null> => {
    const result = await query('SELECT * FROM journals WHERE slug = $1', [
      slug,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Find a journal by title for a specific user
   */
  findByTitle: async (
    userId: number,
    title: string
  ): Promise<Journal | null> => {
    const result = await query(
      'SELECT * FROM journals WHERE user_id = $1 AND title = $2',
      [userId, title]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new journal
   */
  create: async (journalData: CreateJournal): Promise<Journal> => {
    const result = await query(
      `INSERT INTO journals (
        user_id, title, description, slug, public
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        journalData.user_id,
        journalData.title,
        journalData.description || null,
        journalData.slug || null,
        journalData.public !== undefined ? journalData.public : false,
      ]
    );
    return result.rows[0];
  },

  /**
   * Update an existing journal
   */
  update: async (
    id: string,
    journalData: UpdateJournal
  ): Promise<Journal | null> => {
    const sets = [];
    const values = [];
    let paramIndex = 1;

    if (journalData.title !== undefined) {
      sets.push(`title = $${paramIndex}`);
      values.push(journalData.title);
      paramIndex++;
    }

    if (journalData.description !== undefined) {
      sets.push(`description = $${paramIndex}`);
      values.push(journalData.description);
      paramIndex++;
    }

    if (journalData.slug !== undefined) {
      sets.push(`slug = $${paramIndex}`);
      values.push(journalData.slug);
      paramIndex++;
    }

    if (journalData.public !== undefined) {
      sets.push(`public = $${paramIndex}`);
      values.push(journalData.public);
      paramIndex++;
    }

    if (sets.length === 0) {
      return await journalRepository.findById(id);
    }

    sets.push(`updated_at = NOW()`);

    values.push(id);
    const result = await query(
      `UPDATE journals SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a journal
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await query(
      'DELETE FROM journals WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount) {
      return result.rowCount > 0;
    }

    return false;
  },
};
