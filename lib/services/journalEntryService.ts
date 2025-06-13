import { CreateJournalEntry, UpdateJournalEntry } from '../models/JournalEntry';
import { journalEntryRepository } from '../repositories/journalEntryRepository';
import { journalRepository } from '../repositories/journalRepository';

export const journalEntryService = {
  getTotalEntriesForUser: async (userId: number) => {
    const totalEntries = await journalEntryRepository.findTotalEntryCountByUserId(userId);

    return {
      totalEntries,
    };
  },

  getJournalEntries: async (journalId: string, userId?: number) => {
    const journal = await journalRepository.findById(journalId);
    
    if (!journal) {
      return [];
    }

    if (journal.public) {
      return journalEntryRepository.findByJournalId(journalId);
    }

    if (userId && journal.user_id === userId) {
      return journalEntryRepository.findByJournalId(journalId);
    }

    return [];
  },

  getJournalEntryById: async (id: string, userId?: number) => {
    const entry = await journalEntryRepository.findById(id);
    
    if (!entry) {
      return null;
    }

    const journal = await journalRepository.findById(entry.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.public) {
      return entry;
    }

    if (userId && journal.user_id === userId) {
      return entry;
    }

    return null;
  },

  createJournalEntry: async (userId: number, data: CreateJournalEntry) => {
    const journal = await journalRepository.findById(data.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return journalEntryRepository.create(data);
  },

  updateJournalEntry: async (id: string, userId: number, data: UpdateJournalEntry) => {
    const entry = await journalEntryRepository.findById(id);

    if (!entry) {
      return null;
    }

    const journal = await journalRepository.findById(entry.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return journalEntryRepository.update(id, data);
  },

  deleteJournalEntry: async (id: string, userId: number) => {
    const entry = await journalEntryRepository.findById(id);

    if (!entry) {
      return false;
    }

    const journal = await journalRepository.findById(entry.journal_id);

    if (!journal) {
      return false;
    }

    if (journal.user_id !== userId) {
      return false;
    }

    return journalEntryRepository.delete(id);
  }
};
