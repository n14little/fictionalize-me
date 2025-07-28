import { Journal, CreateJournal, UpdateJournal } from '../models/Journal';
import { createJournalRepository } from '../repositories/journalRepository.factory';
import { QueryFunction } from '../db/types';

export const createJournalService = (query: QueryFunction) => {
  const journalRepository = createJournalRepository(query);
  
  return {
    getUserJournals: async (userId: number): Promise<Journal[]> => {
      return journalRepository.findByUserId(userId);
    },

    getJournalById: async (
      id: string,
      userId?: number
    ): Promise<Journal | null> => {
      const journal = await journalRepository.findById(id);

      if (!journal) {
        return null;
      }

      if (journal.public) {
        return journal;
      }

      if (userId && journal.user_id === userId) {
        return journal;
      }

      return null;
    },

    getOrCreateDailyWriteJournal: async (userId: number): Promise<Journal> => {
      // Use race-condition-free database method
      return journalRepository.findOrCreateDailyWrite(userId);
    },

    createJournal: async (
      userId: number,
      data: Omit<CreateJournal, 'user_id'>
    ): Promise<Journal> => {
      return journalRepository.create({
        user_id: userId,
        title: data.title,
        description: data.description,
        public: data.public,
      });
    },

    updateJournal: async (
      id: string,
      userId: number,
      data: UpdateJournal
    ): Promise<Journal | null> => {
      const journal = await journalRepository.findById(id);

      if (!journal) {
        return null;
      }

      if (journal.user_id !== userId) {
        return null;
      }

      return journalRepository.update(id, data);
    },

    deleteJournal: async (id: string, userId: number): Promise<boolean> => {
      const journal = await journalRepository.findById(id);

      if (!journal) {
        return false;
      }

      if (journal.user_id !== userId) {
        return false;
      }

      return journalRepository.delete(id);
    },
  };
};
