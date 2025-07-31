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
        ),
        journal_insert AS (
            INSERT INTO journals (user_id, title, description, public)
            SELECT 
                test_user.id,
                'My Test Journal',
                'A sample journal created for testing in the ${environment} environment',
                false
            FROM test_user
            ON CONFLICT (user_id, title) DO NOTHING
            RETURNING id, user_id
        ),
        journal_data AS (
            SELECT COALESCE(ji.id, j.id) as journal_id, COALESCE(ji.user_id, j.user_id) as user_id
            FROM test_user tu
            LEFT JOIN journal_insert ji ON ji.user_id = tu.id
            LEFT JOIN journals j ON j.user_id = tu.id AND j.title = 'My Test Journal'
        )
        -- Insert sample journal entries (only if they don't already exist)
        INSERT INTO journal_entries (journal_id, title, content, created_at)
        SELECT 
            jd.journal_id,
            entry_data.title,
            entry_data.content::jsonb,
            entry_data.entry_date
        FROM journal_data jd
        CROSS JOIN (
            VALUES 
                ('Morning Reflections', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Started the day with a peaceful walk. The sunrise was particularly beautiful today, casting golden light across the neighborhood. I feel grateful for these quiet moments before the day begins."}]}]}', CURRENT_DATE - INTERVAL '3 days'),
                ('Project Progress', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Made significant progress on the development project today. Implemented the user authentication flow and fixed several bugs. Still need to work on the dashboard layout, but feeling good about the momentum."}]}]}', CURRENT_DATE - INTERVAL '2 days'),
                ('Weekend Adventures', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Spent the weekend exploring a new hiking trail with friends. The weather was perfect and the views from the summit were incredible. These outdoor adventures always help me reset and recharge for the week ahead."}]}]}', CURRENT_DATE - INTERVAL '1 day'),
                ('Learning Journey', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Been diving deep into React patterns and best practices. The concepts are starting to click, and I can see how they apply to real-world projects. Documentation and hands-on practice are both essential."}]}]}', CURRENT_DATE),
                ('Evening Thoughts', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Reflecting on the week that has passed. There were challenges, but also many small victories. Important to celebrate progress, even when it feels incremental. Tomorrow is a new opportunity."}]}]}', CURRENT_DATE)
        ) as entry_data(title, content, entry_date)
        WHERE NOT EXISTS (
            SELECT 1 FROM journal_entries je 
            WHERE je.journal_id = jd.journal_id AND je.title = entry_data.title
        );

        -- Insert sample tasks (only if they don't already exist)
        WITH test_user AS (
            SELECT id FROM users WHERE email = 'test@example.com'
        ),
        user_journal AS (
            SELECT j.id as journal_id, j.user_id
            FROM journals j 
            JOIN test_user tu ON j.user_id = tu.id 
            WHERE j.title = 'My Test Journal'
        )
        INSERT INTO tasks (user_id, journal_id, title, description, completed, priority, created_at)
        SELECT 
            uj.user_id,
            uj.journal_id,
            task_data.title,
            task_data.description,
            task_data.completed,
            task_data.priority,
            CURRENT_TIMESTAMP - (task_data.days_ago || ' days')::INTERVAL
        FROM user_journal uj
        CROSS JOIN (
            VALUES 
                ('Update project documentation', 'Add API documentation and usage examples for the journal app', false, 1000, '2'),
                ('Review dashboard layout', 'Fix the border overlap issue in the dashboard columns', false, 2000, '0'),
                ('Write blog post -- edited', 'Draft article about React server components and their benefits', false, 3000, '1'),
                ('Plan weekend trip', 'Research destinations and book accommodations for upcoming getaway', false, 4000, '0'),
                ('Read design patterns book', 'Continue reading chapter on Observer pattern', false, 5000, '3'),
                ('Grocery shopping', 'Buy ingredients for this week''s meal prep', true, 6000, '1'),
                ('Call dentist', 'Schedule routine cleaning appointment', true, 7000, '0'),
                ('Some new task', 'A standalone task for testing', false, 8000, '0')
        ) as task_data(title, description, completed, priority, days_ago)
        WHERE NOT EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.user_id = uj.user_id AND t.title = task_data.title
        );

        -- Insert sub-tasks with higher priorities than their parents
        WITH test_user AS (
            SELECT id FROM users WHERE email = 'test@example.com'
        ),
        user_journal AS (
            SELECT j.id as journal_id, j.user_id
            FROM journals j 
            JOIN test_user tu ON j.user_id = tu.id 
            WHERE j.title = 'My Test Journal'
        ),
        parent_tasks AS (
            SELECT t.id as parent_id, t.user_id, t.journal_id, t.title as parent_title
            FROM tasks t
            JOIN user_journal uj ON t.user_id = uj.user_id
            WHERE t.title IN ('Update project documentation', 'Review dashboard layout')
        )
        INSERT INTO tasks (user_id, journal_id, title, description, completed, priority, parent_task_id, created_at)
        SELECT 
            pt.user_id,
            pt.journal_id,
            subtask_data.title,
            subtask_data.description,
            subtask_data.completed,
            subtask_data.priority,
            pt.parent_id,
            CURRENT_TIMESTAMP - (subtask_data.days_ago || ' days')::INTERVAL
        FROM parent_tasks pt
        CROSS JOIN (
            VALUES 
                ('Update project documentation', 'some subtask', 'Create API documentation outline', false, 1500, '1'),
                ('Update project documentation', 'update project documentation subtask', 'Write code examples for API endpoints', false, 1600, '1'),
                ('Review dashboard layout', 'review dashboard layout sub task', 'Fix border overlap in dashboard columns', false, 2100, '0')
        ) as subtask_data(parent_title, title, description, completed, priority, days_ago)
        WHERE pt.parent_title = subtask_data.parent_title
        AND NOT EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.user_id = pt.user_id AND t.title = subtask_data.title
        );

        -- Insert some reference tasks (only if they don't already exist)
        WITH test_user AS (
            SELECT id FROM users WHERE email = 'test@example.com'
        ),
        user_journal AS (
            SELECT j.id as journal_id, j.user_id
            FROM journals j 
            JOIN test_user tu ON j.user_id = tu.id 
            WHERE j.title = 'My Test Journal'
        )
        INSERT INTO reference_tasks (user_id, journal_id, title, description, recurrence_type, recurrence_interval, starts_on, next_scheduled_date, created_at)
        SELECT 
            uj.user_id,
            uj.journal_id,
            ref_task_data.title,
            ref_task_data.description,
            ref_task_data.recurrence_type::recurrence_type_enum,
            ref_task_data.recurrence_interval,
            CURRENT_DATE,
            CURRENT_DATE + (ref_task_data.next_in_days || ' days')::INTERVAL,
            CURRENT_TIMESTAMP
        FROM user_journal uj
        CROSS JOIN (
            VALUES 
                ('Weekly Review', 'Review goals, accomplishments, and plan for the upcoming week', 'weekly', 1, '1'),
                ('Monthly Budget Check', 'Review expenses and adjust budget as needed', 'monthly', 1, '5'),
                ('Exercise Routine', 'Complete 30-minute workout session', 'daily', 2, '0'),
                ('Clean Kitchen', 'Deep clean kitchen surfaces and organize pantry', 'weekly', 2, '3')
        ) as ref_task_data(title, description, recurrence_type, recurrence_interval, next_in_days)
        WHERE NOT EXISTS (
            SELECT 1 FROM reference_tasks rt 
            WHERE rt.user_id = uj.user_id AND rt.title = ref_task_data.title
        );
        
        -- Log that development data was added
        RAISE NOTICE 'Development data added for % environment with journal entries and tasks', '${environment}';
    ELSE
        -- Log that this migration was skipped in production
        RAISE NOTICE 'Skipping development data in % environment', '${environment}';
    END IF;
END
$$;