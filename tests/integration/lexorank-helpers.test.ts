import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TestDatabase } from './testDatabase';

describe('Lexorank Helper Functions - Integration Tests', () => {
  let testDb: TestDatabase;
  let query: ReturnType<TestDatabase['getQueryFunction']>;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    query = testDb.getQueryFunction();
    await testDb.cleanup();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('lexorank_between function', () => {
    it('should generate a rank between two given ranks', async () => {
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['10', '20']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank).not.toBe('10');
      expect(rank).not.toBe('20');
      
      // Verify lexicographic ordering
      expect(rank > '10').toBe(true);
      expect(rank < '20').toBe(true);
      
      // Deterministic equality check
      expect(rank).toBe('1h');
    });

    it('should generate a rank when prev_rank is null', async () => {
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [null, '20']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank < '20').toBe(true);
      
      // Deterministic equality check
      expect(rank).toBe('1z');
    });

    it('should generate a rank when next_rank is null', async () => {
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['10', null]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank > '10').toBe(true);
      
      // Deterministic equality check
      expect(rank).toBe('10a');
    });

    it('should generate a rank when both ranks are null', async () => {
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [null, null]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(typeof rank).toBe('string');
      expect(rank.length).toBeGreaterThan(0);
      
      // Deterministic equality check
      expect(rank).toBe('n');
    });

    it('should handle empty strings like null values', async () => {
      const result1 = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['', '20']
      );
      
      const result2 = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['10', '']
      );
      
      const result3 = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['', '']
      );
      
      expect(result1.rows[0].rank).toBeDefined();
      expect(result2.rows[0].rank).toBeDefined();
      expect(result3.rows[0].rank).toBeDefined();
      
      // Deterministic equality checks
      expect(result1.rows[0].rank).toBe('1z');
      expect(result2.rows[0].rank).toBe('10a');
      expect(result3.rows[0].rank).toBe('n');
    });

    it('should throw error if prev_rank >= next_rank', async () => {
      await expect(
        query('SELECT lexorank_between($1, $2) as rank', ['20', '10'])
      ).rejects.toThrow();
      
      await expect(
        query('SELECT lexorank_between($1, $2) as rank', ['10', '10'])
      ).rejects.toThrow();
    });

    it('should handle large gaps between ranks', async () => {
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['1', 'zzzzzz']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank > '1').toBe(true);
      expect(rank < 'zzzzzz').toBe(true);
      
      // Deterministic equality check
      expect(rank).toBe('i');
    });

    it('should handle small gaps between ranks', async () => {
      // Test with base36 strings that are close
      const result = await query(
        'SELECT lexorank_between($1, $2) as rank',
        ['a', 'c']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank > 'a').toBe(true);
      expect(rank < 'c').toBe(true);
      
      // Deterministic equality check
      expect(rank).toBe('b');
    });
  });

  describe('lexorank_next function', () => {
    it('should generate the next rank after a given rank', async () => {
      const result = await query(
        'SELECT lexorank_next($1) as rank',
        ['10']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank > '10').toBe(true);
      
      // Deterministic equality check - appends 'a' to input
      expect(rank).toBe('10a');
    });

    it('should generate a default rank when input is null', async () => {
      const result = await query(
        'SELECT lexorank_next($1) as rank',
        [null]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(typeof rank).toBe('string');
      expect(rank.length).toBeGreaterThan(0);
      expect(rank).toBe('a'); // New implementation returns 'a' for null
    });

    it('should generate a default rank when input is empty string', async () => {
      const result = await query(
        'SELECT lexorank_next($1) as rank',
        ['']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(typeof rank).toBe('string');
      expect(rank.length).toBeGreaterThan(0);
      expect(rank).toBe('a'); // New implementation returns 'a' for empty string
    });

    it('should generate increasing ranks', async () => {
      const result1 = await query('SELECT lexorank_next($1) as rank', ['1']);
      const result2 = await query('SELECT lexorank_next($1) as rank', [result1.rows[0].rank]);
      const result3 = await query('SELECT lexorank_next($1) as rank', [result2.rows[0].rank]);
      
      const rank1 = result1.rows[0].rank as string;
      const rank2 = result2.rows[0].rank as string;
      const rank3 = result3.rows[0].rank as string;
      
      expect(rank1 > '1').toBe(true);
      expect(rank2 > rank1).toBe(true);
      expect(rank3 > rank2).toBe(true);
      
      // Deterministic equality checks - each appends 'a'
      expect(rank1).toBe('1a');
      expect(rank2).toBe('1aa');
      expect(rank3).toBe('1aaa');
    });

    it('should handle very large ranks', async () => {
      const largeRank = 'zzzzzzzzzz';
      const result = await query(
        'SELECT lexorank_next($1) as rank',
        [largeRank]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank > largeRank).toBe(true);
      
      // Deterministic equality check - appends 'a'
      expect(rank).toBe('zzzzzzzzzza');
    });
  });

  describe('lexorank_before function', () => {
    it('should generate a rank before a given rank', async () => {
      const result = await query(
        'SELECT lexorank_before($1) as rank',
        ['10']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank < '10').toBe(true);
      
      // Deterministic equality check - decrements last character: '0' -> 'z' with prefix decremented
      expect(rank).toBe('0z');
    });

    it('should generate a default rank when input is null', async () => {
      const result = await query(
        'SELECT lexorank_before($1) as rank',
        [null]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(typeof rank).toBe('string');
      expect(rank.length).toBeGreaterThan(0);
      expect(rank).toBe('0'); // New implementation returns '0' for null
    });

    it('should generate a default rank when input is empty string', async () => {
      const result = await query(
        'SELECT lexorank_before($1) as rank',
        ['']
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(typeof rank).toBe('string');
      expect(rank.length).toBeGreaterThan(0);
      expect(rank).toBe('0'); // New implementation returns '0' for empty string
    });

    it('should generate decreasing ranks', async () => {
      const result1 = await query('SELECT lexorank_before($1) as rank', ['zz']);
      const result2 = await query('SELECT lexorank_before($1) as rank', [result1.rows[0].rank]);
      const result3 = await query('SELECT lexorank_before($1) as rank', [result2.rows[0].rank]);
      
      const rank1 = result1.rows[0].rank as string;
      const rank2 = result2.rows[0].rank as string;
      const rank3 = result3.rows[0].rank as string;
      
      expect(rank1 < 'zz').toBe(true);
      expect(rank2 < rank1).toBe(true);
      expect(rank3 < rank2).toBe(true);
      
      // Deterministic equality checks
      expect(rank1).toBe('zy'); // 'zz' -> decrement last 'z' to 'y'
      expect(rank2).toBe('zx'); // 'zy' -> decrement 'y' to 'x'
      expect(rank3).toBe('zw'); // 'zx' -> decrement 'x' to 'w'
    });

    it('should not generate negative values and handle zero appropriately', async () => {
      // Test with very small values
      const result1 = await query('SELECT lexorank_before($1) as rank', ['1']);
      const result2 = await query('SELECT lexorank_before($1) as rank', ['2']);
      
      const rank1 = result1.rows[0].rank as string;
      const rank2 = result2.rows[0].rank as string;
      
      expect(rank1).toBeDefined();
      expect(rank2).toBeDefined();
      // '0' is a valid output since it's lexicographically before '1'
      expect(rank1 < '1').toBe(true);
      expect(rank2 < '2').toBe(true);
      
      // Deterministic equality checks
      expect(rank1).toBe('0'); // '1' -> previous character is '0'
      expect(rank2).toBe('1'); // '2' -> previous character is '1'
    });

    it('should handle very small ranks', async () => {
      const smallRank = '1';
      const result = await query(
        'SELECT lexorank_before($1) as rank',
        [smallRank]
      );
      
      const rank = result.rows[0].rank as string;
      expect(rank).toBeDefined();
      expect(rank < smallRank).toBe(true);
      // '0' is a valid result since it comes before '1' lexicographically
      
      // Deterministic equality check
      expect(rank).toBe('0');
    });
  });

  describe('Helper functions', () => {
    it('should work with lexorank_pad_string helper function', async () => {
      const testCases = [
        { input: 'a', length: 3, expected: '00a' },
        { input: 'abc', length: 3, expected: 'abc' },
        { input: '', length: 2, expected: '00' },
        { input: null, length: 2, expected: '00' }
      ];
      
      for (const testCase of testCases) {
        const result = await query(
          'SELECT lexorank_pad_string($1, $2) as padded',
          [testCase.input, testCase.length]
        );
        expect(result.rows[0].padded).toBe(testCase.expected);
      }
    });

    it('should work with lexorank_midpoint helper function', async () => {
      const result = await query(
        'SELECT lexorank_midpoint($1, $2) as midpoint',
        ['a', 'z']
      );
      
      const midpoint = result.rows[0].midpoint as string;
      expect(midpoint > 'a').toBe(true);
      expect(midpoint < 'z').toBe(true);
      
      // Deterministic equality check
      expect(midpoint).toBe('m');
    });
  });

  describe('Integration with existing lexo_priority column', () => {
    it('should generate valid lexorank values for database ordering', async () => {
      // Generate a sequence of ranks and verify they sort correctly
      const ranks: string[] = [];
      
      // Start with a base rank  
      let currentRank = await query('SELECT lexorank_between($1, $2) as rank', [null, null]);
      ranks.push(currentRank.rows[0].rank);
      
      // Generate 5 more ranks, each after the previous
      for (let i = 0; i < 5; i++) {
        const nextRank = await query('SELECT lexorank_next($1) as rank', [ranks[ranks.length - 1]]);
        ranks.push(nextRank.rows[0].rank);
      }
      
      // Generate some ranks between existing ranks using different pairs to avoid duplicates
      const betweenRank1 = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [ranks[0], ranks[1]]
      );
      ranks.push(betweenRank1.rows[0].rank);
      
      const betweenRank2 = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [ranks[1], ranks[2]]
      );
      ranks.push(betweenRank2.rows[0].rank);
      
      // All ranks should be unique (no duplicates expected with different inputs)
      const uniqueRanks = [...new Set(ranks)];
      expect(uniqueRanks.length).toBe(ranks.length);
      
      // Verify sorting order
      const sortedRanks = [...ranks].sort();
      const manualSort = [...ranks].sort((a, b) => a.localeCompare(b));
      expect(sortedRanks).toEqual(manualSort);
    });

    it('should work with PostgreSQL ORDER BY clause', async () => {
      // Create some test data in a temporary table
      await query(`
        CREATE TEMPORARY TABLE test_lexorank_order (
          id SERIAL PRIMARY KEY,
          name TEXT,
          lexo_rank TEXT
        )
      `);
      
      // Generate and insert test ranks
      const ranks: string[] = [];
      const names = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
      
      for (let i = 0; i < names.length; i++) {
        let rank: string;
        if (i === 0) {
          const result = await query('SELECT lexorank_between($1, $2) as rank', [null, null]);
          rank = result.rows[0].rank;
        } else {
          const result = await query('SELECT lexorank_next($1) as rank', [ranks[ranks.length - 1]]);
          rank = result.rows[0].rank;
        }
        ranks.push(rank);
        
        await query(
          'INSERT INTO test_lexorank_order (name, lexo_rank) VALUES ($1, $2)',
          [names[i], rank]
        );
      }
      
      // Insert one between first and second
      const betweenResult = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [ranks[0], ranks[1]]
      );
      await query(
        'INSERT INTO test_lexorank_order (name, lexo_rank) VALUES ($1, $2)',
        ['Between First and Second', betweenResult.rows[0].rank]
      );
      
      // Query with ORDER BY and verify ordering
      const orderedResult = await query(`
        SELECT name, lexo_rank 
        FROM test_lexorank_order 
        ORDER BY lexo_rank ASC
      `);
      
      expect(orderedResult.rows.length).toBe(6);
      expect(orderedResult.rows[0].name).toBe('First');
      expect(orderedResult.rows[1].name).toBe('Between First and Second');
      expect(orderedResult.rows[2].name).toBe('Second');
      expect(orderedResult.rows[3].name).toBe('Third');
      expect(orderedResult.rows[4].name).toBe('Fourth');
      expect(orderedResult.rows[5].name).toBe('Fifth');
    });
  });

  describe('Edge cases', () => {
    it('should handle minimal rank differences', async () => {
      // Start with two close base36 strings
      const rank1 = 'a';  
      const rank2 = 'c';  
      
      const betweenResult = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [rank1, rank2]
      );
      
      const betweenRank = betweenResult.rows[0].rank as string;
      expect(betweenRank > rank1).toBe(true);
      expect(betweenRank < rank2).toBe(true);
      
      // Deterministic equality check
      expect(betweenRank).toBe('b');
    });

    it('should handle maximum practical range', async () => {
      const minRank = '1';
      const maxRank = 'zzzzz'; // Very large base36 number
      
      const betweenResult = await query(
        'SELECT lexorank_between($1, $2) as rank',
        [minRank, maxRank]
      );
      
      const betweenRank = betweenResult.rows[0].rank as string;
      expect(betweenRank > minRank).toBe(true);
      expect(betweenRank < maxRank).toBe(true);
      
      // Deterministic equality check
      expect(betweenRank).toBe('i');
    });

    it('should handle case sensitivity consistently', async () => {
      // Test that our functions handle lowercase consistently
      const result1 = await query('SELECT lexorank_next($1) as rank', ['abc']);
      const result2 = await query('SELECT lexorank_next($1) as rank', ['ABC']);
      
      // Both should work (functions should handle case conversion)
      expect(result1.rows[0].rank).toBeDefined();
      expect(result2.rows[0].rank).toBeDefined();
      
      // Deterministic equality checks - both convert to lowercase and append 'a'
      expect(result1.rows[0].rank).toBe('abca');
      expect(result2.rows[0].rank).toBe('abca'); // converts uppercase to lowercase then appends 'a'
    });
  });
});