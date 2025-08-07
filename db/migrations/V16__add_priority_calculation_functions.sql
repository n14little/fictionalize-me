-- Add database functions for priority calculation to enable single-query task operations
-- This eliminates the need for JavaScript-based priority calculations

-- Function to calculate the next priority for a task at the top of the list
-- New tasks rise to the top for easy visibility and manual organization
CREATE OR REPLACE FUNCTION calculate_next_priority(
    p_user_id INTEGER
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    min_priority DOUBLE PRECISION;
BEGIN
    SELECT MIN(priority) INTO min_priority
    FROM tasks 
    WHERE user_id = p_user_id;
    
    -- Place new task at the top with reasonable spacing
    RETURN COALESCE(min_priority / 2.0, 1000);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority for insertion between two existing tasks
CREATE OR REPLACE FUNCTION calculate_priority_between(
    p_user_id INTEGER,
    p_after_task_id UUID DEFAULT NULL,
    p_before_task_id UUID DEFAULT NULL
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    after_priority DOUBLE PRECISION;
    before_priority DOUBLE PRECISION;
    new_priority DOUBLE PRECISION;
BEGIN
    -- Get after task priority if specified
    IF p_after_task_id IS NOT NULL THEN
        SELECT priority INTO after_priority 
        FROM tasks 
        WHERE id = p_after_task_id AND user_id = p_user_id;
    END IF;
    
    -- Get before task priority if specified
    IF p_before_task_id IS NOT NULL THEN
        SELECT priority INTO before_priority 
        FROM tasks 
        WHERE id = p_before_task_id AND user_id = p_user_id;
    END IF;
    
    -- Case 1: Moving to the very end (after task but no before task)
    IF p_after_task_id IS NOT NULL AND p_before_task_id IS NULL THEN
        -- Find the task immediately after the specified after_task
        SELECT priority INTO before_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND priority > after_priority 
        ORDER BY priority ASC 
        LIMIT 1;
    END IF;
    
    -- Case 2: Moving to the very beginning (before task but no after task)
    IF p_after_task_id IS NULL AND p_before_task_id IS NOT NULL THEN
        -- Find the task immediately before the specified before_task
        SELECT priority INTO after_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND priority < before_priority 
        ORDER BY priority DESC 
        LIMIT 1;
    END IF;
    
    -- Calculate new priority based on available boundaries
    IF after_priority IS NOT NULL AND before_priority IS NOT NULL THEN
        -- Insert between two tasks using midpoint
        new_priority := (after_priority + before_priority) / 2.0;
    ELSIF after_priority IS NOT NULL THEN
        -- Insert after a task (at the end)
        new_priority := after_priority + 100;
    ELSIF before_priority IS NOT NULL THEN
        -- Insert before a task (at the beginning)
        new_priority := before_priority / 2.0;
    ELSE
        -- No reference tasks, use default
        new_priority := 1000;
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
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    reference_priority DOUBLE PRECISION;
    adjacent_priority DOUBLE PRECISION;
    new_priority DOUBLE PRECISION;
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
    SELECT priority INTO reference_priority
    FROM tasks
    WHERE id = p_reference_task_id AND user_id = p_user_id;
    
    IF reference_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find adjacent task based on position
    IF p_position = 'above' THEN
        -- Find task immediately before the reference task
        EXECUTE 'SELECT priority FROM tasks WHERE ' || where_clause || 
                ' AND priority < $2 ORDER BY priority DESC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSIF p_position = 'below' THEN
        -- Find task immediately after the reference task  
        EXECUTE 'SELECT priority FROM tasks WHERE ' || where_clause ||
                ' AND priority > $2 ORDER BY priority ASC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSE
        RETURN NULL; -- Invalid position
    END IF;
    
    -- Calculate new priority
    IF adjacent_priority IS NOT NULL THEN
        -- Insert between reference and adjacent task using midpoint
        new_priority := (reference_priority + adjacent_priority) / 2.0;
    ELSIF p_position = 'above' THEN
        -- No task before reference - insert at beginning
        new_priority := reference_priority / 2.0;
    ELSE -- p_position = 'below'
        -- No task after reference - insert at end
        new_priority := reference_priority + 100;
    END IF;
    
    RETURN new_priority;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority for sub-tasks relative to parent and siblings
CREATE OR REPLACE FUNCTION calculate_subtask_priority(
    p_user_id INTEGER,
    p_parent_task_id UUID,
    p_insert_position TEXT DEFAULT 'end' -- 'end', 'start', or specific position logic could be added later
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    parent_priority DOUBLE PRECISION;
    next_root_priority DOUBLE PRECISION;
    max_subtask_priority DOUBLE PRECISION;
    subtask_count INTEGER;
    new_priority DOUBLE PRECISION;
BEGIN
    -- Get parent task priority
    SELECT priority INTO parent_priority
    FROM tasks
    WHERE id = p_parent_task_id AND user_id = p_user_id;
    
    IF parent_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find the next task that doesn't belong to the same parent as our target parent
    -- This handles nested hierarchies properly by not jumping to root tasks unnecessarily
    SELECT priority INTO next_root_priority
    FROM tasks
    WHERE user_id = p_user_id 
      AND priority > parent_priority
      AND parent_task_id IS DISTINCT FROM p_parent_task_id
    ORDER BY priority ASC
    LIMIT 1;
    
    -- If no next root task found, use reasonable spacing
    IF next_root_priority IS NULL THEN
        -- Get current max priority and add reasonable spacing
        SELECT MAX(priority) INTO next_root_priority
        FROM tasks
        WHERE user_id = p_user_id;
        next_root_priority := COALESCE(GREATEST(parent_priority * 2, next_root_priority + 100), parent_priority + 1000);
    END IF;
    
    -- Count existing sub-tasks
    SELECT COUNT(*), MAX(priority) INTO subtask_count, max_subtask_priority
    FROM tasks
    WHERE parent_task_id = p_parent_task_id;
    
    -- Calculate spacing between parent and next root task
    -- Formula: parent_priority + ((subtask_index + 1) * ((next_root - parent) / (total_subtasks + 1)))
    IF p_insert_position = 'end' THEN
        new_priority := parent_priority + ((subtask_count + 1) * ((next_root_priority - parent_priority) / (subtask_count + 2)));
    ELSIF p_insert_position = 'start' THEN
        -- Insert as first sub-task
        new_priority := parent_priority + ((next_root_priority - parent_priority) / (subtask_count + 2));
    ELSE
        -- Default to end for now
        new_priority := parent_priority + ((subtask_count + 1) * ((next_root_priority - parent_priority) / (subtask_count + 2)));
    END IF;
    
    RETURN new_priority;
END;
$$ LANGUAGE plpgsql;