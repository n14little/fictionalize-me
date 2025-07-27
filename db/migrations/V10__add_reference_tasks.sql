-- Add Reference Tasks for recurring task functionality

-- Create enum for recurrence types
CREATE TYPE recurrence_type_enum AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'custom'
);

CREATE TABLE reference_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,

-- Recurrence configuration
recurrence_type recurrence_type_enum NOT NULL,
recurrence_interval SMALLINT DEFAULT 1,
recurrence_days_of_week SMALLINT[] CHECK (
    array_length(recurrence_days_of_week, 1) IS NULL
    OR (
        array_length(recurrence_days_of_week, 1) <= 7
        AND recurrence_days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
    )
), -- For weekly: [1,2,3,4,5] = Mon-Fri (0=Sunday, 6=Saturday)
recurrence_day_of_month SMALLINT CHECK (
    recurrence_day_of_month IS NULL
    OR (
        recurrence_day_of_month >= 1
        AND recurrence_day_of_month <= 31
    )
), -- For monthly: 15 = 15th of month
recurrence_week_of_month SMALLINT CHECK (
    recurrence_week_of_month IS NULL
    OR (
        recurrence_week_of_month >= 1
        AND recurrence_week_of_month <= 5
    )
), -- For monthly: 2 = second week

-- Scheduling

starts_on DATE NOT NULL,
ends_on DATE CHECK (
    ends_on IS NULL
    OR ends_on >= starts_on
), -- NULL = indefinite
is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to existing tasks table to link to reference tasks
ALTER TABLE tasks
ADD COLUMN reference_task_id UUID REFERENCES reference_tasks (id) ON DELETE SET NULL;

-- Add scheduled date for recurring task instances
ALTER TABLE tasks ADD COLUMN scheduled_date DATE;

-- Create basic indexes for foreign key relationships and query performance
CREATE INDEX idx_reference_tasks_user_id ON reference_tasks (user_id);

CREATE INDEX idx_tasks_reference_task_id ON tasks (reference_task_id);