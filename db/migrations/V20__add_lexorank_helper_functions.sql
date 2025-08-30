-- Add Lexorank helper functions for string-based ordering
-- Lexorank is a string-based ordering system that allows efficient insertion between any two items

-- Helper function to pad a base36 string to 6 characters for consistent ranking
CREATE OR REPLACE FUNCTION lexorank_pad_string(str TEXT, target_length INTEGER DEFAULT 6) RETURNS TEXT AS $$
BEGIN
    IF str IS NULL OR str = '' THEN
        str := '0';
    END IF;
    
    -- Use the provided target_length or default to 6
    IF target_length IS NULL THEN
        target_length := 6;
    END IF;
    
    -- Truncate if longer than target_length
    IF LENGTH(str) > target_length THEN
        str := LEFT(str, target_length);
    END IF;
    
    -- Pad with leading zeros to reach target_length
    WHILE LENGTH(str) < target_length LOOP
        str := '0' || str;
    END LOOP;
    
    RETURN str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Improved function to find the midpoint between two base36 strings lexicographically
CREATE OR REPLACE FUNCTION lexorank_midpoint(str1 TEXT, str2 TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT := '';
    max_len INTEGER;
    i INTEGER;
    char1_val INTEGER;
    char2_val INTEGER;
    mid_val INTEGER;
    found_diff BOOLEAN := FALSE;
BEGIN
    IF str1 IS NULL OR str1 = '' THEN str1 := '000000'; END IF;
    IF str2 IS NULL OR str2 = '' THEN str2 := 'zzzzzz'; END IF;
    
    str1 := LOWER(str1);
    str2 := LOWER(str2);
    
    -- Ensure both strings are exactly 6 characters
    str1 := lexorank_pad_string(str1);
    str2 := lexorank_pad_string(str2);
    
    -- Ensure str1 < str2 lexicographically
    IF str1 >= str2 THEN
        RAISE EXCEPTION 'First string must be less than second string: % >= %', str1, str2;
    END IF;
    
    max_len := 6; -- Fixed length
    
    -- Find midpoint character by character
    FOR i IN 1..max_len LOOP
        char1_val := POSITION(SUBSTRING(str1, i, 1) IN base36_chars) - 1;
        char2_val := POSITION(SUBSTRING(str2, i, 1) IN base36_chars) - 1;
        
        IF char1_val = char2_val AND NOT found_diff THEN
            -- Characters are the same, continue
            result := result || SUBSTRING(base36_chars, char1_val + 1, 1);
        ELSE
            found_diff := TRUE;
            mid_val := (char1_val + char2_val) / 2;
            
            IF mid_val = char1_val AND char2_val > char1_val + 1 THEN
                -- There's room for a midpoint
                result := result || SUBSTRING(base36_chars, char1_val + 2, 1);
                -- Pad remaining positions with '0' to reach 6 characters
                WHILE LENGTH(result) < 6 LOOP
                    result := result || '0';
                END LOOP;
                RETURN result;
            ELSIF mid_val = char1_val THEN
                -- Need to extend the string to create space
                result := result || SUBSTRING(base36_chars, char1_val + 1, 1);
                -- Add a character between '0' and the next char of str2
                IF i < LENGTH(str2) THEN
                    char2_val := POSITION(SUBSTRING(str2, i + 1, 1) IN base36_chars) - 1;
                    IF char2_val > 0 THEN
                        result := result || SUBSTRING(base36_chars, char2_val / 2 + 1, 1);
                    ELSE
                        result := result || 'h'; -- Middle character
                    END IF;
                ELSE
                    result := result || 'h'; -- Middle character
                END IF;
                -- Pad remaining positions with '0' to reach 6 characters
                WHILE LENGTH(result) < 6 LOOP
                    result := result || '0';
                END LOOP;
                RETURN result;
            ELSE
                result := result || SUBSTRING(base36_chars, mid_val + 1, 1);
                -- Pad remaining positions with '0' to reach 6 characters
                WHILE LENGTH(result) < 6 LOOP
                    result := result || '0';
                END LOOP;
                RETURN result;
            END IF;
        END IF;
    END LOOP;
    
    -- If we get here, extend the string
    result := result || 'h'; -- Middle character
    -- Pad remaining positions with '0' to reach 6 characters
    WHILE LENGTH(result) < 6 LOOP
        result := result || '0';
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate the next Lexorank string after a given rank
CREATE OR REPLACE FUNCTION lexorank_next(rank TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT;
    i INTEGER;
    current_char TEXT;
    char_pos INTEGER;
    carry BOOLEAN := TRUE;
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN '000001'; -- Start with '000001'
    END IF;
    
    rank := LOWER(rank);
    rank := lexorank_pad_string(rank); -- Ensure 6 characters
    result := rank;
    
    -- Start from the rightmost character and work backwards
    FOR i IN REVERSE 6..1 LOOP
        IF NOT carry THEN
            EXIT;
        END IF;
        
        current_char := SUBSTRING(result, i, 1);
        char_pos := POSITION(current_char IN base36_chars);
        
        IF char_pos < LENGTH(base36_chars) THEN
            -- Can increment this character
            result := SUBSTRING(result, 1, i-1) || SUBSTRING(base36_chars, char_pos + 1, 1) || SUBSTRING(result, i+1);
            carry := FALSE;
        ELSE
            -- This character is 'z', set to '0' and continue carry
            result := SUBSTRING(result, 1, i-1) || '0' || SUBSTRING(result, i+1);
        END IF;
    END LOOP;
    
    -- If we still have carry, we've overflowed (all z's)
    IF carry THEN
        RETURN 'zzzzzz'; -- Maximum possible value
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a Lexorank string before a given rank  
CREATE OR REPLACE FUNCTION lexorank_before(rank TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT;
    i INTEGER;
    current_char TEXT;
    char_pos INTEGER;
    borrow BOOLEAN := TRUE;
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN '000000'; -- Default rank before most strings
    END IF;
    
    rank := LOWER(rank);
    rank := lexorank_pad_string(rank); -- Ensure 6 characters
    result := rank;
    
    -- Special case: if input is all zeros, can't go lower
    IF result = '000000' THEN
        RETURN '000000';
    END IF;
    
    -- Start from the rightmost character and work backwards
    FOR i IN REVERSE 6..1 LOOP
        IF NOT borrow THEN
            EXIT;
        END IF;
        
        current_char := SUBSTRING(result, i, 1);
        char_pos := POSITION(current_char IN base36_chars);
        
        IF char_pos > 1 THEN
            -- Can decrement this character
            result := SUBSTRING(result, 1, i-1) || SUBSTRING(base36_chars, char_pos - 1, 1) || SUBSTRING(result, i+1);
            borrow := FALSE;
        ELSE
            -- This character is '0', set to 'z' and continue borrow
            result := SUBSTRING(result, 1, i-1) || 'z' || SUBSTRING(result, i+1);
        END IF;
    END LOOP;
    
    -- If we still have borrow, we've underflowed (all 0's)
    IF borrow THEN
        RETURN '000000'; -- Minimum possible value
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a Lexorank string between two given ranks
CREATE OR REPLACE FUNCTION lexorank_between(prev_rank TEXT, next_rank TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    i INTEGER;
    char_check TEXT;
BEGIN
    -- Validate prev_rank contains only base36 characters
    IF prev_rank IS NOT NULL AND prev_rank != '' THEN
        FOR i IN 1..LENGTH(prev_rank) LOOP
            char_check := SUBSTRING(LOWER(prev_rank), i, 1);
            IF POSITION(char_check IN base36_chars) = 0 THEN
                RAISE EXCEPTION 'prev_rank contains invalid character: %', char_check;
            END IF;
        END LOOP;
    END IF;
    
    -- Validate next_rank contains only base36 characters
    IF next_rank IS NOT NULL AND next_rank != '' THEN
        FOR i IN 1..LENGTH(next_rank) LOOP
            char_check := SUBSTRING(LOWER(next_rank), i, 1);
            IF POSITION(char_check IN base36_chars) = 0 THEN
                RAISE EXCEPTION 'next_rank contains invalid character: %', char_check;
            END IF;
        END LOOP;
    END IF;
    
    -- Case 1: Both ranks are NULL - return a default middle value
    IF (prev_rank IS NULL OR prev_rank = '') AND (next_rank IS NULL OR next_rank = '') THEN
        RETURN 'n00000'; -- Middle of base36 alphabet, padded to 6 chars
    END IF;
    
    -- Case 2: prev_rank is NULL - return something before next_rank
    IF prev_rank IS NULL OR prev_rank = '' THEN
        RETURN lexorank_before(next_rank);
    END IF;
    
    -- Case 3: next_rank is NULL - return something after prev_rank
    IF next_rank IS NULL OR next_rank = '' THEN
        RETURN lexorank_next(prev_rank);
    END IF;
    
    -- Case 4: Both ranks exist - find the midpoint
    RETURN lexorank_midpoint(LOWER(prev_rank), LOWER(next_rank));
END;
$$ LANGUAGE plpgsql IMMUTABLE;