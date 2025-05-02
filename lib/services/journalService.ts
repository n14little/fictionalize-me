import { Journal, CreateJournal, UpdateJournal } from '../models/Journal';
import { journalRepository } from '../repositories/journalRepository';
import { authService } from './authService';
import slugify from 'slugify';

export const journalService = {
  /**
   * Get all journals for a user
   */
  getUserJournals: async (userId: number): Promise<Journal[]> => {
    return journalRepository.findByUserId(userId);
  },

  /**
   * Get all public journals
   */
  getPublicJournals: async (): Promise<Journal[]> => {
    return journalRepository.findPublic();
  },

  /**
   * Get a journal by ID with access check
   */
  getJournalById: async (id: string, userId?: number): Promise<Journal | null> => {
    const journal = await journalRepository.findById(id);
    
    if (!journal) {
      return null;
    }

    // If journal is public, allow access
    if (journal.public) {
      return journal;
    }

    // If userId is provided, check if they own the journal
    if (userId && journal.user_id === userId) {
      return journal;
    }

    // If no userId provided, deny access to private journals
    if (!userId) {
      return null;
    }

    // Check if the user has access through auth service
    const hasAccess = await authService.checkAccess(userId, id);
    return hasAccess ? journal : null;
  },

  /**
   * Get a journal by slug
   */
  getJournalBySlug: async (slug: string, userId?: number): Promise<Journal | null> => {
    const journal = await journalRepository.findBySlug(slug);
    
    if (!journal) {
      return null;
    }

    // If journal is public, allow access
    if (journal.public) {
      return journal;
    }

    // If userId is provided, check if they own the journal
    if (userId && journal.user_id === userId) {
      return journal;
    }

    // If no userId provided, deny access to private journals
    if (!userId) {
      return null;
    }

    // Check if the user has access through auth service
    const hasAccess = await authService.checkAccess(userId, journal.id);
    return hasAccess ? journal : null;
  },

  /**
   * Create a new journal
   */
  createJournal: async (userId: number, data: Omit<CreateJournal, 'user_id'>): Promise<Journal> => {
    // Generate a slug if one wasn't provided
    let slug = data.slug;
    if (!slug && data.title) {
      slug = slugify(data.title, { lower: true, strict: true });
      
      // Check if slug already exists
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

  /**
   * Update an existing journal
   */
  updateJournal: async (id: string, userId: number, data: UpdateJournal): Promise<Journal | null> => {
    // Get the journal first
    const journal = await journalRepository.findById(id);
    
    if (!journal) {
      return null;
    }

    // Check if the user owns the journal
    if (journal.user_id !== userId) {
      const hasAccess = await authService.checkAccess(userId, id);
      if (!hasAccess) {
        return null;
      }
    }

    // If we're updating the title, update the slug if it wasn't manually set before
    const updateData: UpdateJournal = { ...data };
    if (data.title && !journal.slug) {
      updateData.slug = slugify(data.title, { lower: true, strict: true });
      
      // Check if slug already exists
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

  /**
   * Delete a journal
   */
  deleteJournal: async (id: string, userId: number): Promise<boolean> => {
    // Get the journal first
    const journal = await journalRepository.findById(id);
    
    if (!journal) {
      return false;
    }

    // Check if the user owns the journal
    if (journal.user_id !== userId) {
      const hasAccess = await authService.checkAccess(userId, id);
      if (!hasAccess) {
        return false;
      }
    }

    return journalRepository.delete(id);
  }
};