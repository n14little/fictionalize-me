import { describe, it, expect } from 'vitest';

describe('Lexorank Migration', () => {
  it('should verify migration file exists and has correct content', () => {
    // This test verifies the migration file structure
    const fs = require('fs');
    const path = require('path');

    const migrationPath = path.join(
      __dirname,
      '../../db/migrations/V19__add_lexorank_column.sql'
    );

    // Check if migration file exists
    expect(fs.existsSync(migrationPath)).toBe(true);

    // Read migration content
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    // Verify the migration adds the column
    expect(migrationContent).toContain(
      'ALTER TABLE tasks ADD COLUMN lexo_priority TEXT'
    );

    // Verify the migration creates the index
    expect(migrationContent).toContain(
      'CREATE INDEX idx_tasks_lexo_priority ON tasks (lexo_priority)'
    );
  });

  it('should verify schema.sql includes lexo_priority column', () => {
    // This test verifies the schema has been updated
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(__dirname, '../../db/schema.sql');

    // Check if schema file exists
    expect(fs.existsSync(schemaPath)).toBe(true);

    // Read schema content
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Verify the schema includes the lexo_priority column in tasks table
    expect(schemaContent).toContain('lexo_priority text');

    // Verify the schema includes the index for lexo_priority
    expect(schemaContent).toContain(
      'CREATE INDEX idx_tasks_lexo_priority ON public.tasks USING btree (lexo_priority)'
    );

    // Verify the schema includes the drop statement for the index
    expect(schemaContent).toContain(
      'DROP INDEX IF EXISTS public.idx_tasks_lexo_priority'
    );
  });
});
