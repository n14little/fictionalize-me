-- Add parent_task_id column for hierarchical tasks
ALTER TABLE tasks
ADD COLUMN parent_task_id UUID REFERENCES tasks (id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_tasks_parent_task_id ON tasks (parent_task_id);

-- Note: Max depth validation (3 levels) and circular reference prevention
-- will be enforced at the application level due to complexity of SQL recursive checks