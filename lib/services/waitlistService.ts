import { QueryFunction } from '../db/types';
import { WaitlistEntry } from '../models/WaitlistEntry';
import { createWaitlistRepository } from '../repositories/waitlistRepository';
import { query } from '../db';

export const createWaitlistService = (query: QueryFunction) => {
  const waitlistRepository = createWaitlistRepository(query);

  return {
    /**
     * Get all waitlist entries
     */
    getAllEntries: async (): Promise<WaitlistEntry[]> => {
      return waitlistRepository.findAll();
    },

    /**
     * Add a new entry to the waitlist
     */
    addToWaitlist: async (
      email: string,
      interest?: string
    ): Promise<WaitlistEntry | null> => {
      // Repository handles upsert with ON CONFLICT DO NOTHING
      return waitlistRepository.create({
        email,
        interest,
      });
    },
  };
};

export const waitlistService = createWaitlistService(query);
