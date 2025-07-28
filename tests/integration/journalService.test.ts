import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createJournalService } from '../../lib/services/journalService';

describe('JournalService - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let journalService: ReturnType<typeof createJournalService>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    journalService = createJournalService(query);

    // Clean up before each test
    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('createJournal', () => {
    it('should create a new journal for a user', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const journalData = {
        title: 'My Test Journal',
        description: 'This is a test journal',
        public: false,
      };

      // Act
      const createdJournal = await journalService.createJournal(
        testUser.id,
        journalData
      );

      // Assert
      expect(createdJournal).toBeDefined();
      expect(createdJournal.title).toBe(journalData.title);
      expect(createdJournal.description).toBe(journalData.description);
      expect(createdJournal.public).toBe(journalData.public);
      expect(createdJournal.user_id).toBe(testUser.id);
      expect(createdJournal.id).toBeDefined();
      expect(createdJournal.created_at).toBeDefined();
      expect(createdJournal.updated_at).toBeDefined();
    });

    it('should create a journal with default values when optional fields are omitted', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const journalData = {
        title: 'Minimal Journal',
      };

      // Act
      const createdJournal = await journalService.createJournal(
        testUser.id,
        journalData
      );

      // Assert
      expect(createdJournal).toBeDefined();
      expect(createdJournal.title).toBe(journalData.title);
      expect(createdJournal.description).toBeNull();
      expect(createdJournal.public).toBe(false); // Default value
      expect(createdJournal.user_id).toBe(testUser.id);
    });
  });

  describe('getUserJournals', () => {
    it('should return all journals for a user', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      await fixtures.createTestJournal(testUser.id, { title: 'Journal 1' });
      await fixtures.createTestJournal(testUser.id, { title: 'Journal 2' });

      // Create a journal for a different user to ensure isolation
      const otherUser = await fixtures.createTestUser();
      await fixtures.createTestJournal(otherUser.id, {
        title: 'Other Journal',
      });

      // Act
      const userJournals = await journalService.getUserJournals(testUser.id);

      // Assert
      expect(userJournals).toHaveLength(2);
      expect(userJournals.map((j) => j.title).sort()).toEqual([
        'Journal 1',
        'Journal 2',
      ]);
      expect(userJournals.every((j) => j.user_id === testUser.id)).toBe(true);
    });

    it('should return empty array when user has no journals', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();

      // Act
      const userJournals = await journalService.getUserJournals(testUser.id);

      // Assert
      expect(userJournals).toHaveLength(0);
    });
  });

  describe('getJournalById', () => {
    it('should return journal when user owns it', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const journal = await fixtures.createTestJournal(testUser.id, {
        title: 'My Journal',
      });

      // Act
      const result = await journalService.getJournalById(
        journal.id,
        testUser.id
      );

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(journal.id);
      expect(result!.title).toBe('My Journal');
    });

    it('should return null when user does not own the journal and it is private', async () => {
      // Arrange
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const journal = await fixtures.createTestJournal(owner.id, {
        title: 'Private Journal',
        public: false,
      });

      // Act
      const result = await journalService.getJournalById(
        journal.id,
        otherUser.id
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return journal when it is public, regardless of ownership', async () => {
      // Arrange
      const owner = await fixtures.createTestUser();
      const otherUser = await fixtures.createTestUser();
      const journal = await fixtures.createTestJournal(owner.id, {
        title: 'Public Journal',
        public: true,
      });

      // Act
      const result = await journalService.getJournalById(
        journal.id,
        otherUser.id
      );

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(journal.id);
      expect(result!.title).toBe('Public Journal');
    });

    it('should return null when journal does not exist', async () => {
      // Arrange
      const testUser = await fixtures.createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act
      const result = await journalService.getJournalById(
        nonExistentId,
        testUser.id
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
