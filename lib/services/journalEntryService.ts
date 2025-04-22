import { JournalEntry, CreateJournalEntry, UpdateJournalEntry } from '../models/JournalEntry';
import { journalEntryRepository } from '../repositories/journalEntryRepository';
import { journalRepository } from '../repositories/journalRepository';
import { authService } from './authService';

export const journalEntryService = {
  /**
   * Get all entries for a journal with access check
   */
  getJournalEntries: async (journalId: string, userId?: number): Promise<JournalEntry[]> => {
    // Check if the user has access to the journal
    const journal = await journalRepository.findById(journalId);
    
    if (!journal) {
      return [];
    }

    // If journal is public, allow access
    if (journal.public) {
      return journalEntryRepository.findByJournalId(journalId);
    }

    // If userId is provided, check if they own the journal
    if (userId && journal.user_id === userId) {
      return journalEntryRepository.findByJournalId(journalId);
    }

    // If no userId provided, deny access to private journals
    if (!userId) {
      return [];
    }

    // Check if the user has access through auth service
    const hasAccess = await authService.checkAccess(userId, journalId);
    return hasAccess ? journalEntryRepository.findByJournalId(journalId) : [];
  },

  /**
   * Get a journal entry by ID with access check
   */
  getJournalEntryById: async (id: string, userId?: number): Promise<JournalEntry | null> => {
    const entry = await journalEntryRepository.findById(id);
    
    if (!entry) {
      return null;
    }

    // Get the journal to check access
    const journal = await journalRepository.findById(entry.journal_id);
    
    if (!journal) {
      return null;
    }

    // If journal is public, allow access
    if (journal.public) {
      return entry;
    }

    // If userId is provided, check if they own the journal
    if (userId && journal.user_id === userId) {
      return entry;
    }

    // If no userId provided, deny access to private journals
    if (!userId) {
      return null;
    }

    // Check if the user has access through auth service
    const hasAccess = await authService.checkAccess(userId, journal.id);
    return hasAccess ? entry : null;
  },

  /**
   * Create a new journal entry with access check
   */
  createJournalEntry: async (userId: number, data: CreateJournalEntry): Promise<JournalEntry | null> => {
    // Check if the user has access to the journal
    const journal = await journalRepository.findById(data.journal_id);
    
    if (!journal) {
      return null;
    }

    // Check if the user owns the journal
    if (journal.user_id !== userId) {
      const hasAccess = await authService.checkAccess(userId, journal.id);
      if (!hasAccess) {
        return null;
      }
    }

    return journalEntryRepository.create(data);
  },

  /**
   * Update an existing journal entry with access check
   */
  updateJournalEntry: async (id: string, userId: number, data: UpdateJournalEntry): Promise<JournalEntry | null> => {
    // Get the entry first
    const entry = await journalEntryRepository.findById(id);
    
    if (!entry) {
      return null;
    }

    // Get the journal to check access
    const journal = await journalRepository.findById(entry.journal_id);
    
    if (!journal) {
      return null;
    }

    // Check if the user owns the journal
    if (journal.user_id !== userId) {
      const hasAccess = await authService.checkAccess(userId, journal.id);
      if (!hasAccess) {
        return null;
      }
    }

    return journalEntryRepository.update(id, data);
  },

  /**
   * Delete a journal entry with access check
   */
  deleteJournalEntry: async (id: string, userId: number): Promise<boolean> => {
    // Get the entry first
    const entry = await journalEntryRepository.findById(id);
    
    if (!entry) {
      return false;
    }

    // Get the journal to check access
    const journal = await journalRepository.findById(entry.journal_id);
    
    if (!journal) {
      return false;
    }

    // Check if the user owns the journal
    if (journal.user_id !== userId) {
      const hasAccess = await authService.checkAccess(userId, journal.id);
      if (!hasAccess) {
        return false;
      }
    }

    return journalEntryRepository.delete(id);
  }
};