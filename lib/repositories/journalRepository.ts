import { query } from '../db';
import { QueryFunction } from '../db/types';
import { Journal, CreateJournal, UpdateJournal } from '../models/Journal';

export const createJournalRepository = (query: QueryFunction) => ({
  /**
   * Find all journals for a user
   */
  findByUserId: async (userId: number): Promise<Journal[]> => {
    const result = await query(
      'SELECT * FROM journals WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows as Journal[];
  },

  /**
   * Find a journal by ID
   */
  findById: async (id: string): Promise<Journal | null> => {
    const result = await query('SELECT * FROM journals WHERE id = $1', [id]);
    return (result.rows[0] as Journal) || null;
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
    return (result.rows[0] as Journal) || null;
  },

  /**
   * Find or create a Daily Write journal for a user (race-condition safe)
   */
  findOrCreateDailyWrite: async (userId: number): Promise<Journal> => {
    const result = await query(
      `INSERT INTO journals (user_id, title, description, public) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, title) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, 'Daily Write', 'Journal for daily writing exercises', false]
    );
    return result.rows[0] as Journal;
  },

  /**
   * Create a new journal
   */
  create: async (journalData: CreateJournal): Promise<Journal> => {
    const result = await query(
      `INSERT INTO journals (
        user_id, title, description, public
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        journalData.user_id,
        journalData.title,
        journalData.description || null,
        journalData.public !== undefined ? journalData.public : false,
      ]
    );
    return result.rows[0] as Journal;
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

    if (journalData.public !== undefined) {
      sets.push(`public = $${paramIndex}`);
      values.push(journalData.public);
      paramIndex++;
    }

    if (sets.length === 0) {
      const existingJournal = await query(
        'SELECT * FROM journals WHERE id = $1',
        [id]
      );
      return (existingJournal.rows[0] as Journal) || null;
    }

    sets.push(`updated_at = NOW()`);

    values.push(id);

    const result = await query(
      `UPDATE journals SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return (result.rows[0] as Journal) || null;
  },

  /**
   * Delete a journal
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await query('DELETE FROM journals WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  },
});

// Create the default instance using the default query function
export const journalRepository = createJournalRepository(query);
