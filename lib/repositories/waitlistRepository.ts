import { query } from '../db';
import { QueryFunction } from '../db/types';
import { WaitlistEntry, CreateWaitlistEntry } from '../models/WaitlistEntry';

export const createWaitlistRepository = (query: QueryFunction) => ({
  /**
   * Find all waitlist entries
   */
  findAll: async (): Promise<WaitlistEntry[]> => {
    const result = await query(
      'SELECT * FROM waitlist_entries ORDER BY created_at DESC'
    );
    return result.rows as WaitlistEntry[];
  },

  /**
   * Find a waitlist entry by ID
   */
  findById: async (id: number): Promise<WaitlistEntry | null> => {
    const result = await query('SELECT * FROM waitlist_entries WHERE id = $1', [
      id,
    ]);
    return (result.rows[0] as WaitlistEntry) || null;
  },

  /**
   * Find a waitlist entry by email
   */
  findByEmail: async (email: string): Promise<WaitlistEntry | null> => {
    const result = await query(
      'SELECT * FROM waitlist_entries WHERE email = $1',
      [email]
    );
    return (result.rows[0] as WaitlistEntry) || null;
  },

  /**
   * Create a new waitlist entry (upsert - updates if email already exists)
   */
  create: async (entryData: CreateWaitlistEntry): Promise<WaitlistEntry> => {
    const result = await query(
      `INSERT INTO waitlist_entries (email, interest) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO UPDATE SET 
         interest = EXCLUDED.interest 
       RETURNING *`,
      [entryData.email, entryData.interest || null]
    );

    return result.rows[0] as WaitlistEntry;
  },
});

export const waitlistRepository = createWaitlistRepository(query);
