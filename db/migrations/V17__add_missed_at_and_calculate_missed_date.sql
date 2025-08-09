-- Add missed_at column to tasks table and create calculate_missed_date function
-- For recurring tasks, missed date is calculated same as next_scheduled_date
-- For regular tasks, missed date is 3 days from creation date

-- Add missed_at column to tasks table
ALTER TABLE tasks ADD COLUMN missed_at DATE;

-- Create function to calculate missed date for a task
CREATE OR REPLACE FUNCTION calculate_missed_date(
    p_created_at TIMESTAMP WITH TIME ZONE,
    p_recurrence_type SMALLINT,
    p_recurrence_interval SMALLINT DEFAULT NULL,
    p_recurrence_days_of_week SMALLINT[] DEFAULT NULL,
    p_recurrence_day_of_month SMALLINT DEFAULT NULL,
    p_starts_on DATE DEFAULT NULL,
    p_ends_on DATE DEFAULT NULL,
    p_from_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
    missed_date DATE;
BEGIN
    -- Check if this is a recurring task (recurrence_type 1-5) or regular task (recurrence_type 6)
    IF p_recurrence_type IN (1, 2, 3, 4, 5) THEN
        -- Recurring task: delegate to calculate_next_scheduled_date function
        missed_date := calculate_next_scheduled_date(
            int_to_recurrence_type_enum(p_recurrence_type),
            p_recurrence_interval,
            p_recurrence_days_of_week,
            p_recurrence_day_of_month,
            p_starts_on,
            p_ends_on,
            p_from_date
        );
    ELSE
        -- Regular task: 3 days from creation date
        missed_date := p_created_at::DATE + INTERVAL '3 days';
    END IF;
    
    RETURN missed_date;
END;
$$ LANGUAGE plpgsql;

-- Update existing tasks with calculated missed_at dates
-- First update recurring tasks (those with reference_task_id)
UPDATE tasks
SET
    missed_at = calculate_missed_date (
        tasks.created_at,
        tasks.recurrence_type,
        rt.recurrence_interval,
        rt.recurrence_days_of_week,
        rt.recurrence_day_of_month,
        rt.starts_on,
        rt.ends_on,
        CURRENT_DATE
    )
FROM reference_tasks rt
WHERE
    tasks.reference_task_id = rt.id
    AND tasks.missed_at IS NULL;

-- Then update regular tasks (those without reference_task_id)
UPDATE tasks
SET
    missed_at = calculate_missed_date (
        tasks.created_at,
        tasks.recurrence_type,
        NULL::smallint,
        NULL::smallint[],
        NULL::smallint,
        NULL::date,
        NULL::date,
        CURRENT_DATE
    )
WHERE
    tasks.reference_task_id IS NULL
    AND tasks.missed_at IS NULL;

-- Create index for efficient missed_at queries (user_id first for OLTP queries)
CREATE INDEX idx_tasks_user_missed_at ON tasks (user_id, missed_at);