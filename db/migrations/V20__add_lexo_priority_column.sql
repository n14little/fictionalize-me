-- Add lexo_priority column and migrate existing numeric priorities to lexorank system

-- Add the new lexo_priority column
ALTER TABLE tasks ADD COLUMN lexo_priority TEXT;

-- Create a function to convert numeric priority to lexorank
CREATE OR REPLACE FUNCTION migrate_priority_to_lexorank()
RETURNS VOID AS $$
DECLARE
    task_record RECORD;
    rank_counter INTEGER := 0;
    rank_value TEXT;
BEGIN
    -- Process tasks in priority order, assigning sequential lexoranks
    FOR task_record IN 
        SELECT id, user_id, priority 
        FROM tasks 
        ORDER BY user_id, priority ASC
    LOOP
        -- Generate lexorank with proper spacing (increment by 1000 for each task)
        rank_counter := rank_counter + 1;
        rank_value := '0|' || LPAD((rank_counter * 1000)::TEXT, 6, '0');
        
        -- Update the task with the new lexorank
        UPDATE tasks 
        SET lexo_priority = rank_value 
        WHERE id = task_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_priority_to_lexorank();

-- Drop the temporary function
DROP FUNCTION migrate_priority_to_lexorank();

-- Make lexo_priority NOT NULL after population
ALTER TABLE tasks ALTER COLUMN lexo_priority SET NOT NULL;

-- Add index for lexo_priority to replace the priority index
CREATE INDEX idx_tasks_lexo_priority ON tasks USING btree (lexo_priority);
CREATE INDEX idx_tasks_user_lexo_priority ON tasks USING btree (user_id, lexo_priority);

-- Update the compound index that includes priority
DROP INDEX IF EXISTS idx_tasks_user_bucketing_type;
CREATE INDEX idx_tasks_user_bucketing_type ON tasks USING btree (user_id, recurrence_type, lexo_priority);