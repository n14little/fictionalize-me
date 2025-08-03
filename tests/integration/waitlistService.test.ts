import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';
import { TestFixtures } from './fixtures';
import { createWaitlistService } from '../../lib/services/waitlistService';

describe('WaitlistService - Integration Tests', () => {
  let testDb: TestDatabase;
  let fixtures: TestFixtures;
  let waitlistService: ReturnType<typeof createWaitlistService>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    const query = testDb.getQueryFunction();
    fixtures = new TestFixtures(query);
    waitlistService = createWaitlistService(query);

    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('addToWaitlist', () => {
    it('should add a new entry to the waitlist', async () => {
      const email = 'test@example.com';
      const interest = 'I want to try journaling';

      const entry = await waitlistService.addToWaitlist(email, interest);

      expect(entry).toBeDefined();
      expect(entry!.email).toBe(email);
      expect(entry!.interest).toBe(interest);
      expect(entry!.id).toBeDefined();
      expect(entry!.created_at).toBeDefined();
    });

    it('should add a new entry without interest', async () => {
      const email = 'test-no-interest@example.com';

      const entry = await waitlistService.addToWaitlist(email);

      expect(entry).toBeDefined();
      expect(entry!.email).toBe(email);
      expect(entry!.interest).toBeNull();
      expect(entry!.id).toBeDefined();
      expect(entry!.created_at).toBeDefined();
    });

    it('should update interest if email already exists', async () => {
      const email = 'existing@example.com';
      const originalInterest = 'Original interest';
      const newInterest = 'New interest';

      const firstEntry = await waitlistService.addToWaitlist(
        email,
        originalInterest
      );
      const secondEntry = await waitlistService.addToWaitlist(
        email,
        newInterest
      );

      expect(firstEntry).toBeDefined();
      expect(secondEntry).toBeDefined();
      expect(firstEntry!.id).toBe(secondEntry!.id);
      expect(secondEntry!.interest).toBe(newInterest);
      expect(secondEntry!.email).toBe(email);
    });

    it('should handle different email formats', async () => {
      const emails = [
        'user@domain.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org',
        'user123@subdomain.domain.com',
      ];

      for (const email of emails) {
        const entry = await waitlistService.addToWaitlist(
          email,
          'Test interest'
        );

        expect(entry).toBeDefined();
        expect(entry!.email).toBe(email);
        expect(entry!.interest).toBe('Test interest');
      }
    });
  });

  describe('getAllEntries', () => {
    it('should return empty array when no entries exist', async () => {
      const entries = await waitlistService.getAllEntries();

      expect(entries).toEqual([]);
    });

    it('should return all waitlist entries', async () => {
      await fixtures.createTestWaitlistEntry({ email: 'user1@example.com' });
      await fixtures.createTestWaitlistEntry({ email: 'user2@example.com' });
      await fixtures.createTestWaitlistEntry({ email: 'user3@example.com' });

      const entries = await waitlistService.getAllEntries();

      expect(entries).toHaveLength(3);
      expect(entries.map((e) => e.email)).toContain('user1@example.com');
      expect(entries.map((e) => e.email)).toContain('user2@example.com');
      expect(entries.map((e) => e.email)).toContain('user3@example.com');
    });

    it('should return entries ordered by created_at DESC', async () => {
      const _firstEntry = await fixtures.createTestWaitlistEntry({
        email: 'first@example.com',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const _secondEntry = await fixtures.createTestWaitlistEntry({
        email: 'second@example.com',
      });

      const entries = await waitlistService.getAllEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].email).toBe('second@example.com');
      expect(entries[1].email).toBe('first@example.com');
      expect(new Date(entries[0].created_at).getTime()).toBeGreaterThan(
        new Date(entries[1].created_at).getTime()
      );
    });

    it('should include all required fields for each entry', async () => {
      const testEmail = 'complete-test@example.com';
      const testInterest = 'Complete data test';

      await fixtures.createTestWaitlistEntry({
        email: testEmail,
        interest: testInterest,
      });

      const entries = await waitlistService.getAllEntries();

      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry.id).toBeDefined();
      expect(entry.email).toBe(testEmail);
      expect(entry.interest).toBe(testInterest);
      expect(entry.created_at).toBeDefined();
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  describe('edge cases and validation', () => {
    it('should handle special characters in email', async () => {
      const email = 'test+special-chars_123@domain-name.co.uk';
      const entry = await waitlistService.addToWaitlist(
        email,
        'Special chars test'
      );

      expect(entry).toBeDefined();
      expect(entry!.email).toBe(email);
    });

    it('should handle long interest text', async () => {
      const email = 'long-interest@example.com';
      const longInterest =
        'This is a very long interest text that contains multiple sentences and explains in detail why someone would want to join the waitlist for this journaling application. It goes on and on with lots of details.';

      const entry = await waitlistService.addToWaitlist(email, longInterest);

      expect(entry).toBeDefined();
      expect(entry!.interest).toBe(longInterest);
    });

    it('should handle empty string interest as null', async () => {
      const email = 'empty-interest@example.com';
      const entry = await waitlistService.addToWaitlist(email, '');

      expect(entry).toBeDefined();
      expect(entry!.interest).toBeNull();
    });

    it('should maintain data integrity across multiple operations', async () => {
      const email1 = 'integrity1@example.com';
      const email2 = 'integrity2@example.com';

      const entry1 = await waitlistService.addToWaitlist(
        email1,
        'First interest'
      );
      const _entry2 = await waitlistService.addToWaitlist(
        email2,
        'Second interest'
      );

      const duplicateAttempt = await waitlistService.addToWaitlist(
        email1,
        'Updated interest'
      );

      const allEntries = await waitlistService.getAllEntries();

      expect(allEntries).toHaveLength(2);
      expect(entry1!.id).toBe(duplicateAttempt!.id);
      expect(duplicateAttempt!.interest).toBe('Updated interest');

      const emails = allEntries.map((e) => e.email);
      expect(emails).toContain(email1);
      expect(emails).toContain(email2);
    });
  });
});
