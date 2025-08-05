-- Fix critical bugs in calculate_next_scheduled_date function
-- Issues:
-- 1. Weekly recurrence ELSE clause doesn't validate same day of week
-- 2. Monthly recurrence has incorrect base date calculation logic
-- 3. Function sometimes returns dates before from_date

CREATE OR REPLACE FUNCTION calculate_next_scheduled_date(
    p_recurrence_type recurrence_type_enum,
    p_recurrence_interval SMALLINT,
    p_recurrence_days_of_week SMALLINT[],
    p_recurrence_day_of_month SMALLINT,
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
    start_day_of_week INTEGER;
    days_to_add INTEGER;
BEGIN
    -- If task has ended, return NULL
    IF p_ends_on IS NOT NULL AND p_from_date > p_ends_on THEN
        RETURN NULL;
    END IF;

    -- Start from the later of starts_on or from_date
    next_date := GREATEST(p_starts_on, p_from_date);

    -- If from_date is the same as starts_on, the first occurrence is due
    IF p_from_date = p_starts_on THEN
        RETURN p_starts_on;
    END IF;

    CASE p_recurrence_type
        WHEN 'daily' THEN
            days_diff := next_date - p_starts_on;
            -- Calculate how many intervals have passed
            IF days_diff % p_recurrence_interval != 0 THEN
                -- Move to next interval
                next_date := p_starts_on + ((days_diff / p_recurrence_interval + 1) * p_recurrence_interval);
            END IF;
            -- If the calculated date is before the from_date, recalculate from the next day
            IF next_date < p_from_date THEN
                 next_date := p_starts_on + (((p_from_date - p_starts_on) / p_recurrence_interval + 1) * p_recurrence_interval);
            END IF;

        WHEN 'weekly' THEN
            IF p_recurrence_days_of_week IS NULL OR array_length(p_recurrence_days_of_week, 1) = 0 THEN
                -- Case: recur on same day of week as starts_on
                target_day_of_week := EXTRACT(DOW FROM p_starts_on);
                current_day_of_week := EXTRACT(DOW FROM next_date);
                
                IF current_day_of_week != target_day_of_week THEN
                    next_date := next_date + (target_day_of_week - current_day_of_week + 7) % 7;
                END IF;

                weeks_diff := floor((next_date - p_starts_on) / 7.0);
                IF weeks_diff % p_recurrence_interval != 0 THEN
                    next_date := next_date + (p_recurrence_interval - (weeks_diff % p_recurrence_interval)) * 7;
                END IF;

                IF next_date < p_from_date THEN
                    next_date := next_date + p_recurrence_interval * 7;
                END IF;
            ELSE
                -- Case: recur on specific days of the week
                LOOP
                    -- Find the next valid day on or after next_date
                    days_to_add := 7;
                    current_day_of_week := EXTRACT(DOW FROM next_date);
                    FOREACH target_day_of_week IN ARRAY p_recurrence_days_of_week LOOP
                        days_to_add = LEAST(days_to_add, (target_day_of_week - current_day_of_week + 7) % 7);
                    END LOOP;
                    next_date := next_date + days_to_add;

                    -- Check if this date is in a valid week interval
                    weeks_diff := floor((next_date - p_starts_on) / 7.0);
                    IF weeks_diff % p_recurrence_interval = 0 THEN
                        EXIT; -- Found a valid date.
                    END IF;
                    
                    -- If not, we need to find the next valid week, and then the first valid day in it.
                    weeks_diff := (floor(weeks_diff / p_recurrence_interval) + 1);
                    next_date := p_starts_on + (weeks_diff * p_recurrence_interval * 7);
                    
                    -- Now find the first valid day in that week.
                    days_to_add := 7;
                    current_day_of_week := EXTRACT(DOW FROM next_date);
                    FOREACH target_day_of_week IN ARRAY p_recurrence_days_of_week LOOP
                        days_to_add = LEAST(days_to_add, (target_day_of_week - current_day_of_week + 7) % 7);
                    END LOOP;
                    next_date := next_date + days_to_add;
                    EXIT; -- This must be it.
                END LOOP;
            END IF;

        WHEN 'monthly' THEN
            -- Calculate months difference from start date
            months_diff := (EXTRACT(YEAR FROM next_date) - EXTRACT(YEAR FROM p_starts_on)) * 12 +
                           (EXTRACT(MONTH FROM next_date) - EXTRACT(MONTH FROM p_starts_on));

            -- Adjust to the next valid interval if not already on one
            IF months_diff % p_recurrence_interval != 0 THEN
                months_diff := (floor(months_diff / p_recurrence_interval) + 1) * p_recurrence_interval;
            END IF;

            -- Calculate the target month and year
            target_month := EXTRACT(MONTH FROM p_starts_on) + months_diff;
            target_year := EXTRACT(YEAR FROM p_starts_on) + floor((target_month - 1) / 12.0);
            target_month := (target_month - 1) % 12 + 1;

            -- Determine the day of the month
            IF p_recurrence_day_of_month IS NOT NULL THEN
                days_in_month := EXTRACT(DAY FROM (date_trunc('month', make_date(target_year, target_month, 1)) + interval '1 month - 1 day'));
                next_date := make_date(target_year, target_month, LEAST(p_recurrence_day_of_month, days_in_month));
            ELSE
                days_in_month := EXTRACT(DAY FROM (date_trunc('month', make_date(target_year, target_month, 1)) + interval '1 month - 1 day'));
                next_date := make_date(target_year, target_month, LEAST(EXTRACT(DAY FROM p_starts_on)::integer, days_in_month));
            END IF;

            -- If the calculated date is before our from_date, move to the next interval
            IF next_date < p_from_date THEN
                months_diff := months_diff + p_recurrence_interval;
                target_month := EXTRACT(MONTH FROM p_starts_on) + months_diff;
                target_year := EXTRACT(YEAR FROM p_starts_on) + floor((target_month - 1) / 12.0);
                target_month := (target_month - 1) % 12 + 1;

                IF p_recurrence_day_of_month IS NOT NULL THEN
                    days_in_month := EXTRACT(DAY FROM (date_trunc('month', make_date(target_year, target_month, 1)) + interval '1 month - 1 day'));
                    next_date := make_date(target_year, target_month, LEAST(p_recurrence_day_of_month, days_in_month));
                ELSE
                    days_in_month := EXTRACT(DAY FROM (date_trunc('month', make_date(target_year, target_month, 1)) + interval '1 month - 1 day'));
                    next_date := make_date(target_year, target_month, LEAST(EXTRACT(DAY FROM p_starts_on)::integer, days_in_month));
                END IF;
            END IF;

        WHEN 'yearly' THEN
            years_diff := EXTRACT(YEAR FROM next_date) - EXTRACT(YEAR FROM p_starts_on);

            -- Adjust to the next valid interval if not already on one
            IF years_diff % p_recurrence_interval != 0 THEN
                years_diff := (floor(years_diff / p_recurrence_interval) + 1) * p_recurrence_interval;
            END IF;

            target_year := EXTRACT(YEAR FROM p_starts_on) + years_diff;

            -- Handle leap year edge case for Feb 29
            IF EXTRACT(MONTH FROM p_starts_on) = 2 AND EXTRACT(DAY FROM p_starts_on) = 29 THEN
                IF NOT (target_year % 4 = 0 AND (target_year % 100 != 0 OR target_year % 400 = 0)) THEN
                    next_date := make_date(target_year, 2, 28);
                ELSE
                    next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::integer, EXTRACT(DAY FROM p_starts_on)::integer);
                END IF;
            ELSE
                next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::integer, EXTRACT(DAY FROM p_starts_on)::integer);
            END IF;

            -- If the calculated date is before our from_date, move to the next interval
            IF next_date < p_from_date THEN
                target_year := target_year + p_recurrence_interval;
                IF EXTRACT(MONTH FROM p_starts_on) = 2 AND EXTRACT(DAY FROM p_starts_on) = 29 THEN
                    IF NOT (target_year % 4 = 0 AND (target_year % 100 != 0 OR target_year % 400 = 0)) THEN
                        next_date := make_date(target_year, 2, 28);
                    ELSE
                        next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::integer, EXTRACT(DAY FROM p_starts_on)::integer);
                    END IF;
                ELSE
                    next_date := make_date(target_year, EXTRACT(MONTH FROM p_starts_on)::integer, EXTRACT(DAY FROM p_starts_on)::integer);
                END IF;
            END IF;

        ELSE
            RETURN NULL;
    END CASE;

    -- Final check to ensure the date is not before the start date
    IF next_date < p_starts_on THEN
      RETURN NULL;
    END IF;

    -- Check if next_date exceeds end date
    IF p_ends_on IS NOT NULL AND next_date > p_ends_on THEN
        RETURN NULL;
    END IF;

    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Update existing reference tasks with corrected next_scheduled_date
UPDATE reference_tasks
SET
    next_scheduled_date = calculate_next_scheduled_date (
        int_to_recurrence_type_enum (recurrence_type),
        recurrence_interval,
        recurrence_days_of_week,
        recurrence_day_of_month,
        starts_on,
        ends_on,
        GREATEST(starts_on, CURRENT_DATE)
    )
WHERE
    is_active = true;