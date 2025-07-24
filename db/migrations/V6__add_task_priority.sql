-- Add priority column to tasks table for drag-and-drop ordering
ALTER TABLE tasks
ADD COLUMN priority DOUBLE PRECISION DEFAULT 1000.0;

-- Create an index for efficient priority-based ordering
CREATE INDEX idx_tasks_priority ON tasks (priority);

-- Update existing tasks to have incrementing priorities (oldest gets lowest priority)
-- This ensures existing tasks maintain their creation order
UPDATE tasks
SET
    priority = (
        SELECT ROW_NUMBER() OVER (
                PARTITION BY
                    user_id
                ORDER BY created_at ASC
            ) * 1000.0
        FROM (
                SELECT id, user_id, created_at
                FROM tasks
            ) t
        WHERE
            t.id = tasks.id
    );