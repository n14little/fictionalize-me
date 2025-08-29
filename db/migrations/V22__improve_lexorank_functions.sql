-- Fix Lexorank helper functions with better lexicographic ordering
-- Replace the problematic add_increment approach with simpler, more reliable methods

-- Drop existing problematic functions
DROP FUNCTION IF EXISTS lexorank_add_increment(TEXT, TEXT);

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