import { journalEntryRepository } from '../repositories/journalEntryRepository';
import { journalRepository } from '../repositories/journalRepository';

export const journalEntryService = {
  getUserEntriesStats: async (userId) => {
    // Get all entries for all journals owned by the user
    const journals = await journalRepository.findByUserId(userId);
    if (!journals || journals.length === 0) {
      return {
        totalEntries: 0,
        totalWords: 0,
        firstEntryDate: null,
        mostRecentEntryDate: null
      };
    }

    // Get entries for all user's journals
    const journalIds = journals.map(journal => journal.id);
    const allEntries = await journalEntryRepository.findByJournalIds(journalIds);
    
    if (!allEntries || allEntries.length === 0) {
      return {
        totalEntries: 0,
        totalWords: 0,
        firstEntryDate: null,
        mostRecentEntryDate: null
      };
    }

    // Calculate total entries
    const totalEntries = allEntries.length;
    
    // Calculate total words
    let totalWords = 0;
    for (const entry of allEntries) {
      // Count words in content (which is a JSONB document)
      const wordCount = countWordsInTiptapJSON(entry.content);
      totalWords += wordCount;
    }
    
    // Sort entries by date
    const sortedByDate = [...allEntries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Get first and most recent entry dates
    const firstEntryDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].created_at) : null;
    const mostRecentEntryDate = sortedByDate.length > 0 
      ? new Date(sortedByDate[sortedByDate.length - 1].created_at) 
      : null;
    
    return {
      totalEntries,
      totalWords,
      firstEntryDate,
      mostRecentEntryDate
    };
  },

  getJournalEntries: async (journalId, userId) => {
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

  getJournalEntryById: async (id, userId) => {
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

  createJournalEntry: async (userId, data) => {
    const journal = await journalRepository.findById(data.journal_id);

    if (!journal) {
      return null;
    }

    if (journal.user_id !== userId) {
      return null;
    }

    return journalEntryRepository.create(data);
  },

  updateJournalEntry: async (id, userId, data) => {
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

  deleteJournalEntry: async (id, userId) => {
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

// Helper function to count words in Tiptap JSON content
function countWordsInTiptapJSON(content) {
  // If content is not an object or doesn't have expected structure, return 0
  if (!content || typeof content !== 'object') {
    return 0;
  }
  
  let wordCount = 0;

  // Process this node if it has text
  if (content.text) {
    // Count words in the text (split by whitespace and filter out empty strings)
    const words = content.text.trim().split(/\s+/).filter(Boolean);
    wordCount += words.length;
  }

  // Recursively count words in child content
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      wordCount += countWordsInTiptapJSON(child);
    }
  }

  return wordCount;
}