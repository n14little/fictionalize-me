-- Add lexo_priority column to tasks table for Lexorank-based priorities
-- This column will support Lexorank string-based ordering while preserving existing numeric priorities

-- Add the new lexo_priority column as TEXT
ALTER TABLE tasks ADD COLUMN lexo_priority TEXT;

-- Create index for efficient lexo_priority-based ordering
CREATE INDEX idx_tasks_lexo_priority ON tasks (lexo_priority);