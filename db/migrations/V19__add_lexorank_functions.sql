-- Add lexorank system for task priorities to resolve precision and scalability issues
-- This replaces floating-point priority calculations with lexicographically ordered strings

-- Helper function to get the next character in base-36 sequence
CREATE OR REPLACE FUNCTION lexorank_next_char(c CHAR)
RETURNS CHAR AS $$
BEGIN
    IF c IS NULL OR c = '' THEN
        RETURN '0';
    ELSIF c = '9' THEN
        RETURN 'a';
    ELSIF c = 'z' THEN
        RETURN NULL; -- overflow, need rebalancing
    ELSIF c ~ '[0-8]' THEN
        RETURN CHR(ASCII(c) + 1);
    ELSIF c ~ '[a-y]' THEN
        RETURN CHR(ASCII(c) + 1);
    ELSE
        RETURN NULL; -- invalid character
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to get the previous character in base-36 sequence
CREATE OR REPLACE FUNCTION lexorank_prev_char(c CHAR)
RETURNS CHAR AS $$
BEGIN
    IF c IS NULL OR c = '' THEN
        RETURN 'z';
    ELSIF c = '0' THEN
        RETURN NULL; -- underflow, need rebalancing
    ELSIF c = 'a' THEN
        RETURN '9';
    ELSIF c ~ '[1-9]' THEN
        RETURN CHR(ASCII(c) - 1);
    ELSIF c ~ '[b-z]' THEN
        RETURN CHR(ASCII(c) - 1);
    ELSE
        RETURN NULL; -- invalid character
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to increment a lexorank (for inserting after)
CREATE OR REPLACE FUNCTION lexorank_increment(rank TEXT)
RETURNS TEXT AS $$
DECLARE
    bucket TEXT;
    rank_part TEXT;
    bucket_delim INTEGER;
    last_char CHAR;
    next_char CHAR;
    result TEXT;
BEGIN
    -- Handle null input
    IF rank IS NULL THEN
        RETURN '0|000001';
    END IF;
    
    -- Split bucket and rank parts
    bucket_delim := POSITION('|' IN rank);
    IF bucket_delim = 0 THEN
        -- No bucket delimiter, treat whole string as rank
        bucket := '0';
        rank_part := rank;
    ELSE
        bucket := SUBSTRING(rank FROM 1 FOR bucket_delim - 1);
        rank_part := SUBSTRING(rank FROM bucket_delim + 1);
    END IF;
    
    -- If rank part is empty or very short, append a character
    IF LENGTH(rank_part) < 6 THEN
        result := bucket || '|' || RPAD(rank_part, 6, '0') || '1';
        RETURN result;
    END IF;
    
    -- Get last character and try to increment
    last_char := RIGHT(rank_part, 1);
    next_char := lexorank_next_char(last_char);
    
    IF next_char IS NOT NULL THEN
        -- Simple increment
        result := bucket || '|' || LEFT(rank_part, LENGTH(rank_part) - 1) || next_char;
    ELSE
        -- Need to append to avoid overflow
        result := bucket || '|' || rank_part || '1';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to decrement a lexorank (for inserting before)
CREATE OR REPLACE FUNCTION lexorank_decrement(rank TEXT)
RETURNS TEXT AS $$
DECLARE
    bucket TEXT;
    rank_part TEXT;
    bucket_delim INTEGER;
    last_char CHAR;
    prev_char CHAR;
    result TEXT;
BEGIN
    -- Handle null input
    IF rank IS NULL THEN
        RETURN '0|zzzzzz';
    END IF;
    
    -- Split bucket and rank parts
    bucket_delim := POSITION('|' IN rank);
    IF bucket_delim = 0 THEN
        bucket := '0';
        rank_part := rank;
    ELSE
        bucket := SUBSTRING(rank FROM 1 FOR bucket_delim - 1);
        rank_part := SUBSTRING(rank FROM bucket_delim + 1);
    END IF;
    
    -- If rank part is empty, return a decremented value
    IF LENGTH(rank_part) < 6 THEN
        result := bucket || '|' || RPAD('', 6, 'z');
        RETURN result;
    END IF;
    
    -- Get last character and try to decrement
    last_char := RIGHT(rank_part, 1);
    prev_char := lexorank_prev_char(last_char);
    
    IF prev_char IS NOT NULL THEN
        -- Simple decrement
        result := bucket || '|' || LEFT(rank_part, LENGTH(rank_part) - 1) || prev_char;
    ELSE
        -- Prepend to avoid underflow
        result := bucket || '|' || 'z' || rank_part;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a lexorank between two existing ranks
CREATE OR REPLACE FUNCTION lexorank_between(prev_rank TEXT, next_rank TEXT)
RETURNS TEXT AS $$
DECLARE
    bucket TEXT;
    prev_part TEXT;
    next_part TEXT;
    bucket_delim INTEGER;
    i INTEGER;
    prev_char CHAR;
    next_char CHAR;
    mid_char CHAR;
    result TEXT;
    max_length INTEGER;
BEGIN
    -- Handle null inputs
    IF prev_rank IS NULL AND next_rank IS NULL THEN
        RETURN '0|000000';
    ELSIF prev_rank IS NULL THEN
        RETURN lexorank_decrement(next_rank);
    ELSIF next_rank IS NULL THEN
        RETURN lexorank_increment(prev_rank);
    END IF;
    
    -- Extract bucket from prev_rank (assume same bucket)
    bucket_delim := POSITION('|' IN prev_rank);
    IF bucket_delim = 0 THEN
        bucket := '0';
        prev_part := prev_rank;
    ELSE
        bucket := SUBSTRING(prev_rank FROM 1 FOR bucket_delim - 1);
        prev_part := SUBSTRING(prev_rank FROM bucket_delim + 1);
    END IF;
    
    -- Extract rank part from next_rank
    bucket_delim := POSITION('|' IN next_rank);
    IF bucket_delim = 0 THEN
        next_part := next_rank;
    ELSE
        next_part := SUBSTRING(next_rank FROM bucket_delim + 1);
    END IF;
    
    -- Pad to same length for comparison
    max_length := GREATEST(LENGTH(prev_part), LENGTH(next_part), 6);
    prev_part := RPAD(prev_part, max_length, '0');
    next_part := RPAD(next_part, max_length, '0');
    
    result := '';
    
    -- Generate middle rank character by character
    FOR i IN 1..max_length LOOP
        prev_char := SUBSTRING(prev_part FROM i FOR 1);
        next_char := SUBSTRING(next_part FROM i FOR 1);
        
        IF prev_char < next_char THEN
            -- Find middle character
            IF (ASCII(next_char) - ASCII(prev_char)) > 1 THEN
                -- There's space for a middle character
                mid_char := CHR((ASCII(prev_char) + ASCII(next_char)) / 2);
                result := result || mid_char;
                EXIT;
            ELSE
                -- No space, use prev_char and continue
                result := result || prev_char;
            END IF;
        ELSIF prev_char = next_char THEN
            -- Same character, continue
            result := result || prev_char;
        ELSE
            -- This shouldn't happen if prev < next
            RAISE EXCEPTION 'Invalid rank order: % >= %', prev_rank, next_rank;
        END IF;
    END LOOP;
    
    -- If we couldn't find a middle position, append to make it between
    IF LENGTH(result) = max_length THEN
        result := result || '1';
    END IF;
    
    -- Ensure minimum length and trim unnecessary trailing zeros
    result := RPAD(result, 6, '0');
    result := RTRIM(result, '0');
    IF result = '' THEN
        result := '0';
    END IF;
    
    RETURN bucket || '|' || result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate initial lexorank
CREATE OR REPLACE FUNCTION lexorank_initial()
RETURNS TEXT AS $$
BEGIN
    RETURN '0|000000';
END;
$$ LANGUAGE plpgsql IMMUTABLE;