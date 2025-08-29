-- Add lexo_priority column to tasks table for Lexorank-based priorities
-- This column will support Lexorank string-based ordering while preserving existing numeric priorities

-- Add the new lexo_priority column as TEXT
ALTER TABLE tasks ADD COLUMN lexo_priority TEXT;

-- Create indices for efficient lexo_priority-based ordering
CREATE INDEX idx_tasks_lexo_priority ON tasks (lexo_priority);
CREATE INDEX idx_tasks_user_lexo_priority ON tasks (user_id, lexo_priority);
CREATE INDEX idx_tasks_journal_lexo_priority ON tasks (journal_id, lexo_priority);