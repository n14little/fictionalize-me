-- Drop the existing global uniqueness constraint on slug
ALTER TABLE journals DROP CONSTRAINT IF EXISTS journals_slug_key;

-- Create a new constraint for slug to be unique per user
ALTER TABLE journals ADD CONSTRAINT journals_user_id_slug_key UNIQUE (user_id, slug);

-- Create Daily Write journals for all users who have at least one journal
DO $$
DECLARE
    user_record RECORD;
    new_journal_id UUID;
    slug_candidate TEXT;
    slug_exists BOOLEAN;
    counter INTEGER;
BEGIN
    -- For each user who has at least one journal
    FOR user_record IN SELECT DISTINCT user_id FROM journals LOOP
        -- Check if user already has a Daily Write journal
        IF NOT EXISTS (
            SELECT 1 FROM journals 
            WHERE user_id = user_record.user_id AND title = 'Daily Write'
        ) THEN
            -- Create a slug with uniqueness check per user
            slug_candidate := 'daily-write';
            counter := 0;
            
            -- Keep checking until we find a slug unique for this user
            LOOP
                SELECT EXISTS(
                    SELECT 1 FROM journals 
                    WHERE slug = slug_candidate AND user_id = user_record.user_id
                ) INTO slug_exists;
                
                EXIT WHEN NOT slug_exists;
                
                counter := counter + 1;
                slug_candidate := 'daily-write-' || counter;
            END LOOP;
            
            -- Create the Daily Write journal for this user
            INSERT INTO journals (
                id, user_id, title, description, slug, public, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 
                user_record.user_id, 
                'Daily Write', 
                'Journal for daily writing exercises', 
                slug_candidate,
                false,
                NOW(),
                NOW()
            ) RETURNING id INTO new_journal_id;
            
            -- Move existing entries with 'Daily Write' mood to the new journal
            -- Start from journal entries, join to journals to get user_id
            UPDATE journal_entries
            SET journal_id = new_journal_id
            WHERE 
                mood = 'Daily Write' AND
                journal_id IN (
                    SELECT id FROM journals 
                    WHERE user_id = user_record.user_id
                );
        ELSE
            -- User already has a Daily Write journal - get its ID
            SELECT id INTO new_journal_id 
            FROM journals 
            WHERE user_id = user_record.user_id AND title = 'Daily Write';
            
            -- Move existing entries with 'Daily Write' mood to the correct journal
            -- Start from journal entries, join to journals to get user_id
            UPDATE journal_entries
            SET journal_id = new_journal_id
            WHERE 
                mood = 'Daily Write' AND
                journal_id IN (
                    SELECT id FROM journals 
                    WHERE user_id = user_record.user_id
                ) AND
                journal_id <> new_journal_id;
        END IF;
    END LOOP;
END$$;