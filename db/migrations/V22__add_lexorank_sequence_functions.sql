-- Add function to generate multiple unique lexoranks for bulk inserts
CREATE OR REPLACE FUNCTION lexorank_generate_sequence(
    start_rank TEXT,
    count INTEGER
) RETURNS TEXT[] AS $$
DECLARE
    result TEXT[] := ARRAY[]::TEXT[];
    current_rank TEXT := start_rank;
    i INTEGER;
BEGIN
    FOR i IN 1..count LOOP
        current_rank := lexorank_increment(current_rank);
        result := result || current_rank;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate next priority for multiple tasks at once
CREATE OR REPLACE FUNCTION calculate_next_priority_sequence(
    p_user_id INTEGER,
    p_count INTEGER
) RETURNS TEXT[] AS $$
DECLARE
    min_priority TEXT;
    base_rank TEXT;
BEGIN
    SELECT MIN(lexo_priority) INTO min_priority
    FROM tasks 
    WHERE user_id = p_user_id;
    
    -- Get the base rank for the top position
    base_rank := COALESCE(lexorank_decrement(min_priority), lexorank_initial());
    
    -- Generate sequence of unique ranks
    RETURN lexorank_generate_sequence(base_rank, p_count);
END;
$$ LANGUAGE plpgsql;