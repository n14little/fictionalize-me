import { Journal, CreateJournal, UpdateJournal } from '../models/Journal';
import { journalRepository } from '../repositories/journalRepository';
import slugify from 'slugify';

export const journalService = {
  getUserJournals: async (userId: number): Promise<Journal[]> => {
    return journalRepository.findByUserId(userId);
  },

  getPublicJournals: async (): Promise<Journal[]> => {
    return journalRepository.findPublic();
  },

  getJournalById: async (id: string, userId?: number): Promise<Journal | null> => {
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

  getJournalBySlug: async (slug: string, userId?: number): Promise<Journal | null> => {
    const journal = await journalRepository.findBySlug(slug);

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
    const title = 'Daily Write';
    // Try to find an existing Daily Write journal
    let journal = await journalRepository.findByTitle(userId, title);
    
    // If not found, create a new one
    if (!journal) {
      // Generate slug from title
      let slug = slugify(title, { lower: true, strict: true });
      
      // Ensure slug is unique for this user
      let counter = 0;
      let uniqueSlug = slug;
      
      // Find all user's journals with similar slugs
      const userJournals = await journalRepository.findByUserId(userId);
      const userSlugs = userJournals.map(j => j.slug);
      
      // Check if the slug exists for this user and make it unique if needed
      while (userSlugs.includes(uniqueSlug)) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      
      // Create the journal
      journal = await journalRepository.create({
        user_id: userId,
        title,
        description: 'Journal for daily writing exercises',
        slug: uniqueSlug,
        public: false
      });
    }
    
    return journal;
  },

  createJournal: async (userId: number, data: Omit<CreateJournal, 'user_id'>): Promise<Journal> => {
    let slug = data.slug;
    if (!slug && data.title) {
      slug = slugify(data.title, { lower: true, strict: true });

      let counter = 0;
      let uniqueSlug = slug;
      while (await journalRepository.findBySlug(uniqueSlug)) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      slug = uniqueSlug;
    }

    return journalRepository.create({
      user_id: userId,
      title: data.title,
      description: data.description,
      slug,
      public: data.public
    });
  },

  updateJournal: async (id: string, userId: number, data: UpdateJournal): Promise<Journal | null> => {
    const journal = await journalRepository.findById(id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    const updateData: UpdateJournal = { ...data };
    if (data.title && !journal.slug) {
      updateData.slug = slugify(data.title, { lower: true, strict: true });

      let counter = 0;
      let uniqueSlug = updateData.slug;
      while (await journalRepository.findBySlug(uniqueSlug)) {
        counter++;
        uniqueSlug = `${updateData.slug}-${counter}`;
      }
      updateData.slug = uniqueSlug;
    }

    return journalRepository.update(id, updateData);
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
  }
};