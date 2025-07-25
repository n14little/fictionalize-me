-- Fix duplicate task priorities by assigning unique priorities based on creation date
-- Most recently created tasks get highest priority (highest numbers)
-- Least recently created tasks get lowest priority (lowest numbers)

WITH
    ranked_tasks AS (
        SELECT id, ROW_NUMBER() OVER (
                PARTITION BY
                    user_id
                ORDER BY created_at ASC
            ) * 1000 as new_priority
        FROM tasks
    )
UPDATE tasks
SET
    priority = ranked_tasks.new_priority
FROM ranked_tasks
WHERE
    tasks.id = ranked_tasks.id;