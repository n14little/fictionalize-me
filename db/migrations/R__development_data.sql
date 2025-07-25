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
            VALUES ('test@example.com', 'auth0|6883a29afbf0d4e556d313f9');

            RAISE NOTICE 'Created test user for % environment', '${environment}';
        END IF;
        
        -- Create a sample journal if one doesn't exist
        WITH test_user AS (
            SELECT id FROM users WHERE email = 'test@example.com'
        )
        INSERT INTO journals (user_id, title, description, public)
        SELECT 
            test_user.id,
            'My Test Journal',
            'A sample journal created for testing in the ${environment} environment',
            false
        FROM test_user
        ON CONFLICT (user_id, title) DO NOTHING;
        
        -- Log that development data was added
        RAISE NOTICE 'Development data added for % environment', '${environment}';
    ELSE
        -- Log that this migration was skipped in production
        RAISE NOTICE 'Skipping development data in % environment', '${environment}';
    END IF;
END
$$;