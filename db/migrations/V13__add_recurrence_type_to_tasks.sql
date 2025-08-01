-- Add recurrence_type columns using integers for better performance
-- This denormalizes the recurrence information and uses integers for direct ordering

-- Step 1: Rename existing enum column and add new integer column
ALTER TABLE reference_tasks
RENAME COLUMN recurrence_type TO recurrence_type_old;

ALTER TABLE reference_tasks
ADD COLUMN recurrence_type SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE tasks ADD COLUMN recurrence_type SMALLINT DEFAULT 6;
-- 6 = regular tasks

-- Step 2: Populate existing reference_tasks with integer recurrence types
UPDATE reference_tasks
SET
    recurrence_type = CASE recurrence_type_old
        WHEN 'daily' THEN 1
        WHEN 'weekly' THEN 2
        WHEN 'monthly' THEN 3
        WHEN 'yearly' THEN 4
        WHEN 'custom' THEN 5
        ELSE 1 -- default to daily, though this shouldn't happen
    END;

-- Step 3: Populate existing tasks with recurrence_type from their reference_tasks
UPDATE tasks
SET
    recurrence_type = rt.recurrence_type
FROM reference_tasks rt
WHERE
    tasks.reference_task_id = rt.id;

-- Step 4: Create helper function to convert integer type to enum for compatibility
CREATE OR REPLACE FUNCTION int_to_recurrence_type_enum(type_int SMALLINT) 
RETURNS recurrence_type_enum AS $$
BEGIN
  RETURN CASE type_int
    WHEN 1 THEN 'daily'::recurrence_type_enum
    WHEN 2 THEN 'weekly'::recurrence_type_enum
    WHEN 3 THEN 'monthly'::recurrence_type_enum
    WHEN 4 THEN 'yearly'::recurrence_type_enum
    WHEN 5 THEN 'custom'::recurrence_type_enum
    ELSE 'daily'::recurrence_type_enum -- default fallback
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Add optimized indexes using integer recurrence_type for direct ordering
CREATE INDEX idx_reference_tasks_recurrence_type ON reference_tasks (recurrence_type);

CREATE INDEX idx_tasks_user_bucketing_type ON tasks (
    user_id,
    recurrence_type,
    priority
);

-- Step 6: Drop old enum column after data migration
ALTER TABLE reference_tasks DROP COLUMN recurrence_type_old;