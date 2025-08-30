-- Add Lexorank helper functions for string-based ordering
-- Lexorank is a string-based ordering system that allows efficient insertion between any two items

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
    IF str1 IS NULL OR str1 = '' THEN str1 := '0'; END IF;
    IF str2 IS NULL OR str2 = '' THEN str2 := 'z'; END IF;
    
    str1 := LOWER(str1);
    str2 := LOWER(str2);
    
    -- Ensure str1 < str2 lexicographically
    IF str1 >= str2 THEN
        RAISE EXCEPTION 'First string must be less than second string: % >= %', str1, str2;
    END IF;
    
    max_len := GREATEST(LENGTH(str1), LENGTH(str2));
    
    -- Pad both strings to the same length with '0' for str1 and 'z' for str2
    WHILE LENGTH(str1) < max_len LOOP
        str1 := str1 || '0';
    END LOOP;
    WHILE LENGTH(str2) < max_len LOOP
        str2 := str2 || 'z';
    END LOOP;
    
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
                RETURN result;
            ELSE
                result := result || SUBSTRING(base36_chars, mid_val + 1, 1);
                RETURN result;
            END IF;
        END IF;
    END LOOP;
    
    -- If we get here, extend the string
    result := result || 'h'; -- Middle character
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate the next Lexorank string after a given rank
CREATE OR REPLACE FUNCTION lexorank_next(rank TEXT) RETURNS TEXT AS $$
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN 'a'; -- Start with 'a'
    END IF;
    
    rank := LOWER(rank);
    
    -- Simple approach: append 'a' to create next rank
    -- This ensures lexicographic ordering: any string + 'a' > original string
    RETURN rank || 'a';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a Lexorank string before a given rank  
CREATE OR REPLACE FUNCTION lexorank_before(rank TEXT) RETURNS TEXT AS $$
DECLARE
    base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    last_char TEXT;
    char_pos INTEGER;
    prefix TEXT;
BEGIN
    IF rank IS NULL OR rank = '' THEN
        RETURN '0'; -- Default rank before most strings
    END IF;
    
    rank := LOWER(rank);
    
    -- If rank is just one character and not '0', return previous character
    IF LENGTH(rank) = 1 AND rank != '0' THEN
        char_pos := POSITION(rank IN base36_chars);
        IF char_pos > 1 THEN
            RETURN SUBSTRING(base36_chars, char_pos - 1, 1);
        ELSE
            RETURN '0';
        END IF;
    END IF;
    
    -- For longer strings, try to decrement the last character
    last_char := SUBSTRING(rank, LENGTH(rank), 1);
    char_pos := POSITION(last_char IN base36_chars);
    
    IF char_pos > 1 THEN
        -- Can decrement the last character
        prefix := SUBSTRING(rank, 1, LENGTH(rank) - 1);
        RETURN prefix || SUBSTRING(base36_chars, char_pos - 1, 1);
    ELSE
        -- Last character is '0', need to work on the prefix
        prefix := SUBSTRING(rank, 1, LENGTH(rank) - 1);
        IF prefix = '' THEN
            RETURN '0';
        ELSE
            RETURN lexorank_before(prefix) || 'z';
        END IF;
    END IF;
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