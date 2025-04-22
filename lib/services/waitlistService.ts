import { WaitlistEntry } from '../models/WaitlistEntry';
import { waitlistRepository } from '../repositories/waitlistRepository';

export const waitlistService = {
  /**
   * Get all waitlist entries
   */
  getAllEntries: async (): Promise<WaitlistEntry[]> => {
    return waitlistRepository.findAll();
  },
  
  /**
   * Add a new entry to the waitlist
   */
  addToWaitlist: async (email: string, interest?: string): Promise<WaitlistEntry | null> => {
    // Check if the email already exists in the waitlist
    const existingEntry = await waitlistRepository.findByEmail(email);
    if (existingEntry) {
      return existingEntry;
    }
    
    // Create a new waitlist entry
    return waitlistRepository.create({
      email,
      interest
    });
  }
};