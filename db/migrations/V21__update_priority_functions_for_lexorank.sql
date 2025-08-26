-- Update priority calculation functions to use lexorank instead of numeric priorities

-- Drop existing functions first to allow return type changes
DROP FUNCTION IF EXISTS calculate_next_priority(INTEGER);
DROP FUNCTION IF EXISTS calculate_priority_between(INTEGER, UUID, UUID);
DROP FUNCTION IF EXISTS calculate_priority_relative_to_task(INTEGER, UUID, TEXT, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS calculate_subtask_priority(INTEGER, UUID, TEXT);

-- Function to calculate the next priority for a task at the top of the list
-- New tasks rise to the top for easy visibility and manual organization
CREATE OR REPLACE FUNCTION calculate_next_priority(
    p_user_id INTEGER
) RETURNS TEXT AS $$
DECLARE
    min_priority TEXT;
BEGIN
    SELECT MIN(lexo_priority) INTO min_priority
    FROM tasks 
    WHERE user_id = p_user_id;
    
    -- Place new task at the top with lexorank decrement
    RETURN COALESCE(lexorank_decrement(min_priority), lexorank_initial());
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority for insertion between two existing tasks
CREATE OR REPLACE FUNCTION calculate_priority_between(
    p_user_id INTEGER,
    p_after_task_id UUID DEFAULT NULL,
    p_before_task_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    after_priority TEXT;
    before_priority TEXT;
    new_priority TEXT;
BEGIN
    -- Get after task priority if specified
    IF p_after_task_id IS NOT NULL THEN
        SELECT lexo_priority INTO after_priority 
        FROM tasks 
        WHERE id = p_after_task_id AND user_id = p_user_id;
    END IF;
    
    -- Get before task priority if specified
    IF p_before_task_id IS NOT NULL THEN
        SELECT lexo_priority INTO before_priority 
        FROM tasks 
        WHERE id = p_before_task_id AND user_id = p_user_id;
    END IF;
    
    -- Case 1: Moving to the very end (after task but no before task)
    IF p_after_task_id IS NOT NULL AND p_before_task_id IS NULL THEN
        -- Find the task immediately after the specified after_task
        SELECT lexo_priority INTO before_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND lexo_priority > after_priority 
        ORDER BY lexo_priority ASC 
        LIMIT 1;
    END IF;
    
    -- Case 2: Moving to the very beginning (before task but no after task)
    IF p_after_task_id IS NULL AND p_before_task_id IS NOT NULL THEN
        -- Find the task immediately before the specified before_task
        SELECT lexo_priority INTO after_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND lexo_priority < before_priority 
        ORDER BY lexo_priority DESC 
        LIMIT 1;
    END IF;
    
    -- Calculate new priority based on available boundaries
    IF after_priority IS NOT NULL AND before_priority IS NOT NULL THEN
        -- Insert between two tasks using lexorank_between
        new_priority := lexorank_between(after_priority, before_priority);
    ELSIF after_priority IS NOT NULL THEN
        -- Insert after a task (at the end)
        new_priority := lexorank_increment(after_priority);
    ELSIF before_priority IS NOT NULL THEN
        -- Insert before a task (at the beginning)
        new_priority := lexorank_decrement(before_priority);
    ELSE
        -- No reference tasks, use default
        new_priority := lexorank_initial();
    END IF;
    
    RETURN new_priority;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority for insertion relative to a specific task (above/below)
CREATE OR REPLACE FUNCTION calculate_priority_relative_to_task(
    p_user_id INTEGER,
    p_reference_task_id UUID,
    p_position TEXT, -- 'above' or 'below'
    p_exclude_task_id UUID DEFAULT NULL, -- task to exclude from calculations (for reordering)
    p_completed_filter BOOLEAN DEFAULT NULL -- if specified, only consider tasks with this completion status
) RETURNS TEXT AS $$
DECLARE
    reference_priority TEXT;
    adjacent_priority TEXT;
    new_priority TEXT;
    where_clause TEXT;
BEGIN
    -- Build dynamic where clause for completion filtering
    where_clause := 'user_id = $1';
    IF p_completed_filter IS NOT NULL THEN
        where_clause := where_clause || ' AND completed = ' || p_completed_filter::TEXT;
    END IF;
    IF p_exclude_task_id IS NOT NULL THEN
        where_clause := where_clause || ' AND id != ''' || p_exclude_task_id::TEXT || '''';
    END IF;
    
    -- Get reference task priority
    SELECT lexo_priority INTO reference_priority
    FROM tasks
    WHERE id = p_reference_task_id AND user_id = p_user_id;
    
    IF reference_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find adjacent task based on position
    IF p_position = 'above' THEN
        -- Find task immediately before the reference task
        EXECUTE 'SELECT lexo_priority FROM tasks WHERE ' || where_clause || 
                ' AND lexo_priority < $2 ORDER BY lexo_priority DESC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSIF p_position = 'below' THEN
        -- Find task immediately after the reference task  
        EXECUTE 'SELECT lexo_priority FROM tasks WHERE ' || where_clause ||
                ' AND lexo_priority > $2 ORDER BY lexo_priority ASC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSE
        RETURN NULL; -- Invalid position
    END IF;
    
    -- Calculate new priority
    IF adjacent_priority IS NOT NULL THEN
        -- Insert between reference and adjacent task using lexorank_between
        IF p_position = 'above' THEN
            new_priority := lexorank_between(adjacent_priority, reference_priority);
        ELSE -- p_position = 'below'
            new_priority := lexorank_between(reference_priority, adjacent_priority);
        END IF;
    ELSIF p_position = 'above' THEN
        -- No task before reference - insert at beginning
        new_priority := lexorank_decrement(reference_priority);
    ELSE -- p_position = 'below'
        -- No task after reference - insert at end
        new_priority := lexorank_increment(reference_priority);
    END IF;
    
    RETURN new_priority;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority for sub-tasks relative to parent and siblings
CREATE OR REPLACE FUNCTION calculate_subtask_priority(
    p_user_id INTEGER,
    p_parent_task_id UUID,
    p_insert_position TEXT DEFAULT 'end' -- 'end', 'start', or specific position logic could be added later
) RETURNS TEXT AS $$
DECLARE
    parent_priority TEXT;
    next_root_priority TEXT;
    max_subtask_priority TEXT;
    subtask_count INTEGER;
    new_priority TEXT;
BEGIN
    -- Get parent task priority
    SELECT lexo_priority INTO parent_priority
    FROM tasks
    WHERE id = p_parent_task_id AND user_id = p_user_id;
    
    IF parent_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find the next task that doesn't belong to the same parent as our target parent
    -- This handles nested hierarchies properly by not jumping to root tasks unnecessarily
    SELECT lexo_priority INTO next_root_priority
    FROM tasks
    WHERE user_id = p_user_id 
      AND lexo_priority > parent_priority
      AND parent_task_id IS DISTINCT FROM p_parent_task_id
    ORDER BY lexo_priority ASC
    LIMIT 1;
    
    -- Count existing sub-tasks and get max priority
    SELECT COUNT(*), MAX(lexo_priority) INTO subtask_count, max_subtask_priority
    FROM tasks
    WHERE parent_task_id = p_parent_task_id;
    
    -- Calculate new priority for subtasks
    IF p_insert_position = 'end' THEN
        IF max_subtask_priority IS NOT NULL THEN
            -- Insert after the last subtask
            IF next_root_priority IS NOT NULL THEN
                new_priority := lexorank_between(max_subtask_priority, next_root_priority);
            ELSE
                new_priority := lexorank_increment(max_subtask_priority);
            END IF;
        ELSE
            -- First subtask
            IF next_root_priority IS NOT NULL THEN
                new_priority := lexorank_between(parent_priority, next_root_priority);
            ELSE
                new_priority := lexorank_increment(parent_priority);
            END IF;
        END IF;
    ELSIF p_insert_position = 'start' THEN
        -- Insert as first sub-task, immediately after parent
        new_priority := lexorank_increment(parent_priority);
    ELSE
        -- Default to end for now
        IF max_subtask_priority IS NOT NULL THEN
            IF next_root_priority IS NOT NULL THEN
                new_priority := lexorank_between(max_subtask_priority, next_root_priority);
            ELSE
                new_priority := lexorank_increment(max_subtask_priority);
            END IF;
        ELSE
            IF next_root_priority IS NOT NULL THEN
                new_priority := lexorank_between(parent_priority, next_root_priority);
            ELSE
                new_priority := lexorank_increment(parent_priority);
            END IF;
        END IF;
    END IF;
    
    RETURN new_priority;
END;
$$ LANGUAGE plpgsql;