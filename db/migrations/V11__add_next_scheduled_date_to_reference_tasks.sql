-- Add next_scheduled_date column to reference_tasks for optimized cron job queries
ALTER TABLE reference_tasks ADD COLUMN next_scheduled_date DATE;

-- Create index for fast cron job queries
CREATE INDEX idx_reference_tasks_next_scheduled_date ON reference_tasks (next_scheduled_date)
WHERE
    is_active = true;

-- Create composite index for per-user queries
CREATE INDEX idx_reference_tasks_user_next_scheduled ON reference_tasks (user_id, next_scheduled_date)
WHERE
    is_active = true;

-- Function to calculate next scheduled date for a reference task
CREATE OR REPLACE FUNCTION calculate_next_scheduled_date(
    p_recurrence_type TEXT,
    p_recurrence_interval INTEGER,
    p_recurrence_days_of_week INTEGER[],
    p_recurrence_day_of_month INTEGER,
    p_starts_on DATE,
    p_ends_on DATE,
    p_from_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
    next_date DATE;
    days_diff INTEGER;
    weeks_diff INTEGER;
    months_diff INTEGER;
    years_diff INTEGER;
    target_year INTEGER;
    target_month INTEGER;
    days_in_month INTEGER;
    current_day_of_week INTEGER;
    target_day_of_week INTEGER;
    days_to_add INTEGER;
BEGIN
    -- If task has ended, return NULL
    IF p_ends_on IS NOT NULL AND p_from_date >= p_ends_on THEN
        RETURN NULL;
    END IF;

    -- Start from the later of starts_on or from_date
    next_date := GREATEST(p_starts_on, p_from_date);

    CASE p_recurrence_type
        WHEN 'daily' THEN
            days_diff := next_date - p_starts_on;
            -- Calculate how many intervals have passed
            IF days_diff % p_recurrence_interval != 0 THEN
                -- Move to next interval
                next_date := p_starts_on + ((days_diff / p_recurrence_interval + 1) * p_recurrence_interval);
            END IF;

        WHEN 'weekly' THEN
            weeks_diff := (next_date - p_starts_on) / 7;
            
            IF p_recurrence_days_of_week IS NOT NULL THEN
                -- Find next occurrence of any specified day of week
                current_day_of_week := EXTRACT(DOW FROM next_date);
                
                -- Try each day in the current week first
                FOR i IN 1..array_length(p_recurrence_days_of_week, 1) LOOP
                    target_day_of_week := p_recurrence_days_of_week[i];
                    IF target_day_of_week >= current_day_of_week THEN
                        days_to_add := target_day_of_week - current_day_of_week;
                        next_date := next_date + days_to_add;
                        
                        -- Check if this falls on a valid week interval
                        weeks_diff := (next_date - p_starts_on) / 7;
                        IF weeks_diff % p_recurrence_interval = 0 THEN
                            RETURN next_date;
                        END IF;
                    END IF;
                END LOOP;
                
                -- If no valid day found in current week, move to next valid week
                weeks_diff := ((next_date - p_starts_on) / 7 / p_recurrence_interval + 1) * p_recurrence_interval;
                next_date := p_starts_on + (weeks_diff * 7);
                
                -- Find first valid day of week in that week
                current_day_of_week := EXTRACT(DOW FROM next_date);
                FOR i IN 1..array_length(p_recurrence_days_of_week, 1) LOOP
                    target_day_of_week := p_recurrence_days_of_week[i];
                    IF target_day_of_week >= current_day_of_week THEN
                        next_date := next_date + (target_day_of_week - current_day_of_week);
                        RETURN next_date;
                    END IF;
                END LOOP;
                
                -- If no day found, use first day of next week
                next_date := next_date + (7 - current_day_of_week + p_recurrence_days_of_week[1]);
            ELSE
                -- Use same day of week as start date
                IF weeks_diff % p_recurrence_interval != 0 THEN
                    weeks_diff := ((weeks_diff / p_recurrence_interval + 1) * p_recurrence_interval);
                    next_date := p_starts_on + (weeks_diff * 7);
                END IF;
            END IF;

        WHEN 'monthly' THEN
            target_year := EXTRACT(YEAR FROM next_date);
            target_month := EXTRACT(MONTH FROM next_date);
            
            -- Calculate months difference
            months_diff := (target_year - EXTRACT(YEAR FROM p_starts_on)) * 12 + 
                          (target_month - EXTRACT(MONTH FROM p_starts_on));
            
            -- Adjust to next valid interval if needed
            IF months_diff % p_recurrence_interval != 0 THEN
                months_diff := ((months_diff / p_recurrence_interval + 1) * p_recurrence_interval);
                target_month := EXTRACT(MONTH FROM p_starts_on) + months_diff;
                target_year := EXTRACT(YEAR FROM p_starts_on) + (target_month - 1) / 12;
                target_month := ((target_month - 1) % 12) + 1;
            END IF;
            
            -- Use specified day of month or original start date's day
            IF p_recurrence_day_of_month IS NOT NULL THEN
                -- Handle end-of-month cases
                days_in_month := EXTRACT(DAYS FROM DATE_TRUNC('MONTH', make_date(target_year, target_month, 1)) + INTERVAL '1 MONTH - 1 DAY');
                next_date := make_date(target_year, target_month, LEAST(p_recurrence_day_of_month, days_in_month));
            ELSE
                days_in_month := EXTRACT(DAYS FROM DATE_TRUNC('MONTH', make_date(target_year, target_month, 1)) + INTERVAL '1 MONTH - 1 DAY');
                next_date := make_date(target_year, target_month, LEAST(EXTRACT(DAY FROM p_starts_on)::INTEGER, days_in_month));
            END IF;
            
            -- If the calculated date is before our from_date, move to next interval
            IF next_date < p_from_date THEN
                months_diff := months_diff + p_recurrence_interval;
                target_month := EXTRACT(MONTH FROM p_starts_on) + months_diff;
                target_year := EXTRACT(YEAR FROM p_starts_on) + (target_month - 1) / 12;
                target_month := ((target_month - 1) % 12) + 1;
                
                IF p_recurrence_day_of_month IS NOT NULL THEN
                    days_in_month := EXTRACT(DAYS FROM DATE_TRUNC('MONTH', make_date(target_year, target_month, 1)) + INTERVAL '1 MONTH - 1 DAY');
                    next_date := make_date(target_year, target_month, LEAST(p_recurrence_day_of_month, days_in_month));
                ELSE
                    days_in_month := EXTRACT(DAYS FROM DATE_TRUNC('MONTH', make_date(target_year, target_month, 1)) + INTERVAL '1 MONTH - 1 DAY');
                    next_date := make_date(target_year, target_month, LEAST(EXTRACT(DAY FROM p_starts_on)::INTEGER, days_in_month));
                END IF;
            END IF;

        WHEN 'yearly' THEN
            target_year := EXTRACT(YEAR FROM next_date);
            years_diff := target_year - EXTRACT(YEAR FROM p_starts_on);
            
            -- Adjust to next valid interval if needed
            IF years_diff % p_recurrence_interval != 0 THEN
                years_diff := ((years_diff / p_recurrence_interval + 1) * p_recurrence_interval);
                target_year := EXTRACT(YEAR FROM p_starts_on) + years_diff;
            END IF;
            
            -- Handle leap year edge case for Feb 29
            IF EXTRACT(MONTH FROM p_starts_on) = 2 AND EXTRACT(DAY FROM p_starts_on) = 29 THEN
                -- If target year is not a leap year, use Feb 28
                IF NOT (target_year % 4 = 0 AND (target_year % 100 != 0 OR target_year % 400 = 0)) THEN
                    next_date := make_date(target_year, 2, 28);
                ELSE
                    next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::INTEGER, EXTRACT(DAY FROM p_starts_on)::INTEGER);
                END IF;
            ELSE
                next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::INTEGER, EXTRACT(DAY FROM p_starts_on)::INTEGER);
            END IF;
            
            -- If the calculated date is before our from_date, move to next interval
            IF next_date < p_from_date THEN
                target_year := target_year + p_recurrence_interval;
                IF EXTRACT(MONTH FROM p_starts_on) = 2 AND EXTRACT(DAY FROM p_starts_on) = 29 THEN
                    IF NOT (target_year % 4 = 0 AND (target_year % 100 != 0 OR target_year % 400 = 0)) THEN
                        next_date := make_date(target_year, 2, 28);
                    ELSE
                        next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::INTEGER, EXTRACT(DAY FROM p_starts_on)::INTEGER);
                    END IF;
                ELSE
                    next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::INTEGER, EXTRACT(DAY FROM p_starts_on)::INTEGER);
                END IF;
            END IF;

        ELSE
            RETURN NULL;
    END CASE;

    -- Check if next_date exceeds end date
    IF p_ends_on IS NOT NULL AND next_date > p_ends_on THEN
        RETURN NULL;
    END IF;

    RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate next_scheduled_date for existing reference tasks
UPDATE reference_tasks
SET
    next_scheduled_date = calculate_next_scheduled_date (
        recurrence_type,
        recurrence_interval,
        recurrence_days_of_week,
        recurrence_day_of_month,
        starts_on,
        ends_on,
        CURRENT_DATE
    )
WHERE
    is_active = true;