-- Update Lexorank helper functions with improved string-based implementation
-- This replaces the previous decimal-based approach with better string manipulation

-- Drop existing functions first
DROP FUNCTION IF EXISTS lexorank_between(TEXT, TEXT);
DROP FUNCTION IF EXISTS lexorank_next(TEXT);
DROP FUNCTION IF EXISTS lexorank_before(TEXT);
DROP FUNCTION IF EXISTS decimal_to_base36(BIGINT);
DROP FUNCTION IF EXISTS base36_to_decimal(TEXT);

-- Helper function to pad a base36 string to a consistent length for comparison
CREATE OR REPLACE FUNCTION lexorank_pad_string(str TEXT, target_length INTEGER) RETURNS TEXT AS $$
BEGIN
    IF str IS NULL OR str = '' THEN
        str := '0';
    END IF;
    
    -- Pad with leading zeros to reach target length
    WHILE LENGTH(str) < target_length LOOP
        str := '0' || str;
    END LOOP;
    
    RETURN str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to increment a base36 string by a specified amount
CREATE OR REPLACE FUNCTION lexorank_add_increment(base_str TEXT, increment TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT := '';
    carry INTEGER := 0;
    base_len INTEGER;
    inc_len INTEGER;
    max_len INTEGER;
    i INTEGER;
    base_val INTEGER;
    inc_val INTEGER;
    sum_val INTEGER;
    char_pos INTEGER;
BEGIN
    IF base_str IS NULL OR base_str = '' THEN
        base_str := '0';
    END IF;
    IF increment IS NULL OR increment = '' THEN
        increment := '0';
    END IF;
    
    base_str := LOWER(base_str);
    increment := LOWER(increment);
    
    base_len := LENGTH(base_str);
    inc_len := LENGTH(increment);
    max_len := GREATEST(base_len, inc_len);
    
    -- Pad both strings to the same length
    base_str := lexorank_pad_string(base_str, max_len);
    increment := lexorank_pad_string(increment, max_len);
    
    -- Add from right to left
    FOR i IN REVERSE max_len..1 LOOP
        -- Get base value
        char_pos := POSITION(SUBSTRING(base_str, i, 1) IN base36_chars);
        base_val := CASE WHEN char_pos > 0 THEN char_pos - 1 ELSE 0 END;
        
        -- Get increment value
        char_pos := POSITION(SUBSTRING(increment, i, 1) IN base36_chars);
        inc_val := CASE WHEN char_pos > 0 THEN char_pos - 1 ELSE 0 END;
        
        sum_val := base_val + inc_val + carry;
        carry := sum_val / 36;
        sum_val := sum_val % 36;
        
        result := SUBSTRING(base36_chars, sum_val + 1, 1) || result;
    END LOOP;
    
    -- Handle final carry
    WHILE carry > 0 LOOP
        result := SUBSTRING(base36_chars, (carry % 36) + 1, 1) || result;
        carry := carry / 36;
    END LOOP;
    
    -- Remove leading zeros (but keep at least one character)
    WHILE LENGTH(result) > 1 AND SUBSTRING(result, 1, 1) = '0' LOOP
        result := SUBSTRING(result, 2);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find the midpoint between two base36 strings lexicographically
CREATE OR REPLACE FUNCTION lexorank_midpoint(str1 TEXT, str2 TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT := '';
    max_len INTEGER;
    i INTEGER;
    char1_val INTEGER;
    char2_val INTEGER;
    mid_val INTEGER;
    carry INTEGER := 0;
    found_diff BOOLEAN := FALSE;
BEGIN
    IF str1 IS NULL OR str1 = '' THEN str1 := '0'; END IF;
    IF str2 IS NULL OR str2 = '' THEN str2 := '0'; END IF;
    
    str1 := LOWER(str1);
    str2 := LOWER(str2);
    
    -- Ensure str1 < str2 lexicographically
    IF str1 >= str2 THEN
        RAISE EXCEPTION 'First string must be less than second string: % >= %', str1, str2;
    END IF;
    
    max_len := GREATEST(LENGTH(str1), LENGTH(str2));
    
    -- Pad both strings to the same length
    str1 := lexorank_pad_string(str1, max_len);
    str2 := lexorank_pad_string(str2, max_len);
    
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
            
            IF mid_val = char1_val THEN
                -- Need to add a character after this position
                result := result || SUBSTRING(base36_chars, char1_val + 1, 1);
                -- Add half-way character at next position
                result := result || SUBSTRING(base36_chars, 18, 1); -- 'h' is roughly middle of base36
                RETURN result;
            ELSE
                result := result || SUBSTRING(base36_chars, mid_val + 1, 1);
                RETURN result;
            END IF;
        END IF;
    END LOOP;
    
    -- If we get here, strings are very close, add a character
    result := result || SUBSTRING(base36_chars, 18, 1); -- 'h' is roughly middle
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate the next Lexorank string after a given rank
CREATE OR REPLACE FUNCTION lexorank_next(rank TEXT) RETURNS TEXT AS $$
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN 'n'; -- Default starting rank (middle of base36)
    END IF;
    
    -- Add a reasonable increment
    RETURN lexorank_add_increment(LOWER(rank), 'n');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a Lexorank string before a given rank
CREATE OR REPLACE FUNCTION lexorank_before(rank TEXT) RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN 'h'; -- Default rank before most strings
    END IF;
    
    rank := LOWER(rank);
    
    -- Try to find midpoint between '0' and the given rank
    BEGIN
        result := lexorank_midpoint('0', rank);
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            -- If that fails, try with a smaller string
            IF LENGTH(rank) > 1 THEN
                RETURN SUBSTRING(rank, 1, LENGTH(rank) - 1) || '0';
            ELSE
                -- For single character, try to go to previous character
                IF rank = '1' THEN
                    RETURN '0h';
                ELSE
                    RETURN '0';
                END IF;
            END IF;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a Lexorank string between two given ranks
CREATE OR REPLACE FUNCTION lexorank_between(prev_rank TEXT, next_rank TEXT) RETURNS TEXT AS $$
BEGIN
    -- Case 1: Both ranks are NULL - return a default middle value
    IF (prev_rank IS NULL OR prev_rank = '') AND (next_rank IS NULL OR next_rank = '') THEN
        RETURN 'n'; -- Middle of base36 alphabet
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