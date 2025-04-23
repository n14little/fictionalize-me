-- Development data migration
-- This repeatable migration adds test data for non-production environments
-- Will only execute in local, development, and test environments

-- Conditional execution based on environment
-- ${environment} placeholder is passed from the db-migrate.sh script
DO $$
BEGIN
    -- Only execute this code if NOT in production
    IF '${environment}' IN ('local', 'development', 'test') THEN
        
        -- Create a test user if one doesn't exist
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com') THEN
            INSERT INTO users (email, external_user_id)
            VALUES ('test@example.com', 'test-user-id');
            
            RAISE NOTICE 'Created test user for % environment', '${environment}';
        END IF;
        
        -- Get the test user ID
        WITH test_user AS (
            SELECT id FROM users WHERE email = 'test@example.com'
        )
        
        -- Create a sample journal if one doesn't exist
        INSERT INTO journals (user_id, title, description, slug, public)
        SELECT 
            test_user.id,
            'My Test Journal',
            'A sample journal created for testing in the ${environment} environment',
            'test-journal-' || '${environment}',
            TRUE
        FROM test_user
        WHERE NOT EXISTS (
            SELECT 1 FROM journals j 
            JOIN users u ON j.user_id = u.id 
            WHERE u.email = 'test@example.com' AND j.title = 'My Test Journal'
        );
        
        -- Log that this migration was skipped in production
        RAISE NOTICE 'Development data added for % environment', '${environment}';
    ELSE
        -- Log that this migration was skipped in production
        RAISE NOTICE 'Skipping development data in % environment', '${environment}';
    END IF;
END
$$;