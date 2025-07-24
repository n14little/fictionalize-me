import { query } from '../db';
import {
  JournalEntry,
  CreateJournalEntry,
  UpdateJournalEntry,
} from '../models/JournalEntry';

export const journalEntryRepository = {
  /**
   * Find all entries for a journal
   */
  findByJournalId: async (journalId: string): Promise<JournalEntry[]> => {
    const result = await query(
      'SELECT * FROM journal_entries WHERE journal_id = $1 ORDER BY updated_at DESC',
      [journalId]
    );
    return result.rows;
  },

  /**
   * Find all entries for multiple journals
   */
  findByJournalIds: async (journalIds: string[]): Promise<JournalEntry[]> => {
    if (!journalIds.length) {
      return [];
    }

    // Create parameter placeholders ($1, $2, etc.) for the query
    const placeholders = journalIds
      .map((_, index) => `$${index + 1}`)
      .join(',');

    const result = await query(
      `SELECT * FROM journal_entries WHERE journal_id IN (${placeholders}) ORDER BY updated_at DESC`,
      journalIds
    );
    return result.rows;
  },

  /**
   * Find recent journal entries for a user across all their journals
   */
  findRecentByUserId: async (
    userId: number,
    limit: number = 5
  ): Promise<JournalEntry[]> => {
    // TODO: needs better pagination
    const result = await query(
      `
        SELECT je.* 
        FROM journal_entries je
        JOIN journals j ON je.journal_id = j.id
        WHERE j.user_id = $1
        ORDER BY je.updated_at DESC
        LIMIT $2
      `,
      [userId, limit]
    );
    return result.rows;
  },

  findTotalEntryCountByUserId: async (userId: number): Promise<number> => {
    const result = await query(
      `
        with user_journals as (
          SELECT id FROM journals WHERE user_id = $1
        )
        SELECT COUNT(*) FROM journal_entries WHERE journal_id IN (SELECT id FROM user_journals)
      `,
      [userId]
    );

    return result?.rows[0]?.count || 0;
  },

  /**
   * Find a journal entry by ID
   */
  findById: async (id: string): Promise<JournalEntry | null> => {
    const result = await query('SELECT * FROM journal_entries WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Create a new journal entry
   */
  create: async (entryData: CreateJournalEntry): Promise<JournalEntry> => {
    const result = await query(
      `INSERT INTO journal_entries (
        journal_id, title, content, mood, location
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        entryData.journal_id,
        entryData.title,
        entryData.content, // PostgreSQL will handle this as JSONB automatically
        entryData.mood || null,
        entryData.location || null,
      ]
    );
    return result.rows[0];
  },

  /**
   * Update an existing journal entry
   */
  update: async (
    id: string,
    entryData: UpdateJournalEntry
  ): Promise<JournalEntry | null> => {
    const sets = [];
    const values = [];
    let paramIndex = 1;

    if (entryData.title !== undefined) {
      sets.push(`title = $${paramIndex}`);
      values.push(entryData.title);
      paramIndex++;
    }

    if (entryData.content !== undefined) {
      sets.push(`content = $${paramIndex}`);
      values.push(entryData.content); // PostgreSQL will handle this as JSONB automatically
      paramIndex++;
    }

    if (entryData.mood !== undefined) {
      sets.push(`mood = $${paramIndex}`);
      values.push(entryData.mood);
      paramIndex++;
    }

    if (entryData.location !== undefined) {
      sets.push(`location = $${paramIndex}`);
      values.push(entryData.location);
      paramIndex++;
    }

    if (sets.length === 0) {
      return await journalEntryRepository.findById(id);
    }

    sets.push(`updated_at = NOW()`);

    values.push(id);
    const result = await query(
      `UPDATE journal_entries SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a journal entry
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount) {
      return result.rowCount > 0;
    }

    return false;
  },
};
