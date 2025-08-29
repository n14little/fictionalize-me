--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_reference_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_parent_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_journal_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reference_tasks DROP CONSTRAINT IF EXISTS reference_tasks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reference_tasks DROP CONSTRAINT IF EXISTS reference_tasks_journal_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journals DROP CONSTRAINT IF EXISTS journals_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_streaks DROP CONSTRAINT IF EXISTS journal_streaks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_journal_id_fkey;
DROP INDEX IF EXISTS public.idx_tasks_user_missed_at;
DROP INDEX IF EXISTS public.idx_tasks_user_id;
DROP INDEX IF EXISTS public.idx_tasks_user_bucketing_type;
DROP INDEX IF EXISTS public.idx_tasks_reference_task_id;
DROP INDEX IF EXISTS public.idx_tasks_priority;
DROP INDEX IF EXISTS public.idx_tasks_parent_task_id;
DROP INDEX IF EXISTS public.idx_tasks_lexo_priority;
DROP INDEX IF EXISTS public.idx_tasks_journal_id;
DROP INDEX IF EXISTS public.idx_tasks_completed;
DROP INDEX IF EXISTS public.idx_reference_tasks_user_next_scheduled;
DROP INDEX IF EXISTS public.idx_reference_tasks_user_id;
DROP INDEX IF EXISTS public.idx_reference_tasks_recurrence_type;
DROP INDEX IF EXISTS public.idx_reference_tasks_next_scheduled_date;
DROP INDEX IF EXISTS public.idx_journals_user_id_and_title;
DROP INDEX IF EXISTS public.idx_journals_user_id;
DROP INDEX IF EXISTS public.idx_journal_streaks_user_id;
DROP INDEX IF EXISTS public.idx_journal_streaks_user_date;
DROP INDEX IF EXISTS public.idx_journal_entries_journal_id;
DROP INDEX IF EXISTS public.flyway_schema_history_s_idx;
ALTER TABLE IF EXISTS ONLY public.waitlist_entries DROP CONSTRAINT IF EXISTS waitlist_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.waitlist_entries DROP CONSTRAINT IF EXISTS waitlist_entries_email_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_external_user_id_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.journals DROP CONSTRAINT IF EXISTS unique_user_journal_title;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.reference_tasks DROP CONSTRAINT IF EXISTS reference_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.journals DROP CONSTRAINT IF EXISTS journals_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_streaks DROP CONSTRAINT IF EXISTS journal_streaks_user_id_streak_date_key;
ALTER TABLE IF EXISTS ONLY public.journal_streaks DROP CONSTRAINT IF EXISTS journal_streaks_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.flyway_schema_history DROP CONSTRAINT IF EXISTS flyway_schema_history_pk;
ALTER TABLE IF EXISTS ONLY public.features DROP CONSTRAINT IF EXISTS features_pkey;
ALTER TABLE IF EXISTS ONLY public.features DROP CONSTRAINT IF EXISTS features_name_key;
ALTER TABLE IF EXISTS public.waitlist_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.journal_streaks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.features ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.waitlist_entries_id_seq;
DROP TABLE IF EXISTS public.waitlist_entries;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.reference_tasks;
DROP TABLE IF EXISTS public.journals;
DROP SEQUENCE IF EXISTS public.journal_streaks_id_seq;
DROP TABLE IF EXISTS public.journal_streaks;
DROP TABLE IF EXISTS public.journal_entries;
DROP TABLE IF EXISTS public.flyway_schema_history;
DROP SEQUENCE IF EXISTS public.features_id_seq;
DROP TABLE IF EXISTS public.features;
DROP FUNCTION IF EXISTS public.int_to_recurrence_type_enum(type_int smallint);
DROP FUNCTION IF EXISTS public.calculate_subtask_priority(p_user_id integer, p_parent_task_id uuid, p_insert_position text);
DROP FUNCTION IF EXISTS public.calculate_priority_relative_to_task(p_user_id integer, p_reference_task_id uuid, p_position text, p_exclude_task_id uuid, p_completed_filter boolean);
DROP FUNCTION IF EXISTS public.calculate_priority_between(p_user_id integer, p_after_task_id uuid, p_before_task_id uuid);
DROP FUNCTION IF EXISTS public.calculate_next_scheduled_date(p_recurrence_type public.recurrence_type_enum, p_recurrence_interval smallint, p_recurrence_days_of_week smallint[], p_recurrence_day_of_month smallint, p_starts_on date, p_ends_on date, p_from_date date);
DROP FUNCTION IF EXISTS public.calculate_next_priority(p_user_id integer);
DROP FUNCTION IF EXISTS public.calculate_missed_date(p_created_at timestamp with time zone, p_recurrence_type smallint, p_recurrence_interval smallint, p_recurrence_days_of_week smallint[], p_recurrence_day_of_month smallint, p_starts_on date, p_ends_on date, p_from_date date);
DROP TYPE IF EXISTS public.recurrence_type_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: recurrence_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recurrence_type_enum AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'custom'
);


--
-- Name: calculate_missed_date(timestamp with time zone, smallint, smallint, smallint[], smallint, date, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_missed_date(p_created_at timestamp with time zone, p_recurrence_type smallint, p_recurrence_interval smallint DEFAULT NULL::smallint, p_recurrence_days_of_week smallint[] DEFAULT NULL::smallint[], p_recurrence_day_of_month smallint DEFAULT NULL::smallint, p_starts_on date DEFAULT NULL::date, p_ends_on date DEFAULT NULL::date, p_from_date date DEFAULT CURRENT_DATE) RETURNS date
    LANGUAGE plpgsql
    AS $$
DECLARE
    missed_date DATE;
BEGIN
    -- Check if this is a recurring task (recurrence_type 1-5) or regular task (recurrence_type 6)
    IF p_recurrence_type IN (1, 2, 3, 4, 5) THEN
        -- Recurring task: delegate to calculate_next_scheduled_date function
        missed_date := calculate_next_scheduled_date(
            int_to_recurrence_type_enum(p_recurrence_type),
            p_recurrence_interval,
            p_recurrence_days_of_week,
            p_recurrence_day_of_month,
            p_starts_on,
            p_ends_on,
            p_from_date
        );
    ELSE
        -- Regular task: 3 days from creation date
        missed_date := p_created_at::DATE + INTERVAL '3 days';
    END IF;
    
    RETURN missed_date;
END;
$$;


--
-- Name: calculate_next_priority(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_priority(p_user_id integer) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE
    min_priority DOUBLE PRECISION;
BEGIN
    SELECT MIN(priority) INTO min_priority
    FROM tasks 
    WHERE user_id = p_user_id;
    
    -- Place new task at the top with reasonable spacing
    RETURN COALESCE(min_priority / 2.0, 1000);
END;
$$;


--
-- Name: calculate_next_scheduled_date(public.recurrence_type_enum, smallint, smallint[], smallint, date, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_scheduled_date(p_recurrence_type public.recurrence_type_enum, p_recurrence_interval smallint, p_recurrence_days_of_week smallint[], p_recurrence_day_of_month smallint, p_starts_on date, p_ends_on date, p_from_date date DEFAULT CURRENT_DATE) RETURNS date
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: calculate_priority_between(integer, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_priority_between(p_user_id integer, p_after_task_id uuid DEFAULT NULL::uuid, p_before_task_id uuid DEFAULT NULL::uuid) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE
    after_priority DOUBLE PRECISION;
    before_priority DOUBLE PRECISION;
    new_priority DOUBLE PRECISION;
BEGIN
    -- Get after task priority if specified
    IF p_after_task_id IS NOT NULL THEN
        SELECT priority INTO after_priority 
        FROM tasks 
        WHERE id = p_after_task_id AND user_id = p_user_id;
    END IF;
    
    -- Get before task priority if specified
    IF p_before_task_id IS NOT NULL THEN
        SELECT priority INTO before_priority 
        FROM tasks 
        WHERE id = p_before_task_id AND user_id = p_user_id;
    END IF;
    
    -- Case 1: Moving to the very end (after task but no before task)
    IF p_after_task_id IS NOT NULL AND p_before_task_id IS NULL THEN
        -- Find the task immediately after the specified after_task
        SELECT priority INTO before_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND priority > after_priority 
        ORDER BY priority ASC 
        LIMIT 1;
    END IF;
    
    -- Case 2: Moving to the very beginning (before task but no after task)
    IF p_after_task_id IS NULL AND p_before_task_id IS NOT NULL THEN
        -- Find the task immediately before the specified before_task
        SELECT priority INTO after_priority
        FROM tasks 
        WHERE user_id = p_user_id 
          AND priority < before_priority 
        ORDER BY priority DESC 
        LIMIT 1;
    END IF;
    
    -- Calculate new priority based on available boundaries
    IF after_priority IS NOT NULL AND before_priority IS NOT NULL THEN
        -- Insert between two tasks using midpoint
        new_priority := (after_priority + before_priority) / 2.0;
    ELSIF after_priority IS NOT NULL THEN
        -- Insert after a task (at the end)
        new_priority := after_priority + 100;
    ELSIF before_priority IS NOT NULL THEN
        -- Insert before a task (at the beginning)
        new_priority := before_priority / 2.0;
    ELSE
        -- No reference tasks, use default
        new_priority := 1000;
    END IF;
    
    RETURN new_priority;
END;
$$;


--
-- Name: calculate_priority_relative_to_task(integer, uuid, text, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_priority_relative_to_task(p_user_id integer, p_reference_task_id uuid, p_position text, p_exclude_task_id uuid DEFAULT NULL::uuid, p_completed_filter boolean DEFAULT NULL::boolean) RETURNS double precision
    LANGUAGE plpgsql
    AS $_$
DECLARE
    reference_priority DOUBLE PRECISION;
    adjacent_priority DOUBLE PRECISION;
    new_priority DOUBLE PRECISION;
    where_clause TEXT;
BEGIN
    -- Build dynamic where clause for completion filtering
    where_clause := 'user_id = $1';
    IF p_completed_filter IS NOT NULL THEN
        where_clause := where_clause || ' AND completed = ' || p_completed_filter::TEXT;
    END IF;
    IF p_exclude_task_id IS NOT NULL THEN
        where_clause := where_clause || ' AND id != ''' || p_exclude_task_id::TEXT || '''';
    END IF;
    
    -- Get reference task priority
    SELECT priority INTO reference_priority
    FROM tasks
    WHERE id = p_reference_task_id AND user_id = p_user_id;
    
    IF reference_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find adjacent task based on position
    IF p_position = 'above' THEN
        -- Find task immediately before the reference task
        EXECUTE 'SELECT priority FROM tasks WHERE ' || where_clause || 
                ' AND priority < $2 ORDER BY priority DESC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSIF p_position = 'below' THEN
        -- Find task immediately after the reference task  
        EXECUTE 'SELECT priority FROM tasks WHERE ' || where_clause ||
                ' AND priority > $2 ORDER BY priority ASC LIMIT 1'
        USING p_user_id, reference_priority
        INTO adjacent_priority;
    ELSE
        RETURN NULL; -- Invalid position
    END IF;
    
    -- Calculate new priority
    IF adjacent_priority IS NOT NULL THEN
        -- Insert between reference and adjacent task using midpoint
        new_priority := (reference_priority + adjacent_priority) / 2.0;
    ELSIF p_position = 'above' THEN
        -- No task before reference - insert at beginning
        new_priority := reference_priority / 2.0;
    ELSE -- p_position = 'below'
        -- No task after reference - insert at end
        new_priority := reference_priority + 100;
    END IF;
    
    RETURN new_priority;
END;
$_$;


--
-- Name: calculate_subtask_priority(integer, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_subtask_priority(p_user_id integer, p_parent_task_id uuid, p_insert_position text DEFAULT 'end'::text) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE
    parent_priority DOUBLE PRECISION;
    next_root_priority DOUBLE PRECISION;
    max_subtask_priority DOUBLE PRECISION;
    subtask_count INTEGER;
    new_priority DOUBLE PRECISION;
BEGIN
    -- Get parent task priority
    SELECT priority INTO parent_priority
    FROM tasks
    WHERE id = p_parent_task_id AND user_id = p_user_id;
    
    IF parent_priority IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find the next task that doesn't belong to the same parent as our target parent
    -- This handles nested hierarchies properly by not jumping to root tasks unnecessarily
    SELECT priority INTO next_root_priority
    FROM tasks
    WHERE user_id = p_user_id 
      AND priority > parent_priority
      AND parent_task_id IS DISTINCT FROM p_parent_task_id
    ORDER BY priority ASC
    LIMIT 1;
    
    -- If no next root task found, use reasonable spacing
    IF next_root_priority IS NULL THEN
        -- Get current max priority and add reasonable spacing
        SELECT MAX(priority) INTO next_root_priority
        FROM tasks
        WHERE user_id = p_user_id;
        next_root_priority := COALESCE(GREATEST(parent_priority * 2, next_root_priority + 100), parent_priority + 1000);
    END IF;
    
    -- Count existing sub-tasks
    SELECT COUNT(*), MAX(priority) INTO subtask_count, max_subtask_priority
    FROM tasks
    WHERE parent_task_id = p_parent_task_id;
    
    -- Calculate spacing between parent and next root task
    -- Formula: parent_priority + ((subtask_index + 1) * ((next_root - parent) / (total_subtasks + 1)))
    IF p_insert_position = 'end' THEN
        new_priority := parent_priority + ((subtask_count + 1) * ((next_root_priority - parent_priority) / (subtask_count + 2)));
    ELSIF p_insert_position = 'start' THEN
        -- Insert as first sub-task
        new_priority := parent_priority + ((next_root_priority - parent_priority) / (subtask_count + 2));
    ELSE
        -- Default to end for now
        new_priority := parent_priority + ((subtask_count + 1) * ((next_root_priority - parent_priority) / (subtask_count + 2)));
    END IF;
    
    RETURN new_priority;
END;
$$;


--
-- Name: int_to_recurrence_type_enum(smallint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.int_to_recurrence_type_enum(type_int smallint) RETURNS public.recurrence_type_enum
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN CASE type_int
    WHEN 1 THEN 'daily'::recurrence_type_enum
    WHEN 2 THEN 'weekly'::recurrence_type_enum
    WHEN 3 THEN 'monthly'::recurrence_type_enum
    WHEN 4 THEN 'yearly'::recurrence_type_enum
    WHEN 5 THEN 'custom'::recurrence_type_enum
    ELSE 'daily'::recurrence_type_enum -- default fallback
  END;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.features (
    id integer NOT NULL,
    name text NOT NULL,
    enabled boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    journal_id uuid NOT NULL,
    title text NOT NULL,
    content jsonb NOT NULL,
    mood text,
    location text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: journal_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    streak_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: journal_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_streaks_id_seq OWNED BY public.journal_streaks.id;


--
-- Name: journals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reference_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id integer NOT NULL,
    journal_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    recurrence_interval smallint DEFAULT 1,
    recurrence_days_of_week smallint[],
    recurrence_day_of_month smallint,
    recurrence_week_of_month smallint,
    starts_on date NOT NULL,
    ends_on date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    next_scheduled_date date,
    recurrence_type smallint DEFAULT 1 NOT NULL,
    CONSTRAINT reference_tasks_check CHECK (((ends_on IS NULL) OR (ends_on >= starts_on))),
    CONSTRAINT reference_tasks_recurrence_day_of_month_check CHECK (((recurrence_day_of_month IS NULL) OR ((recurrence_day_of_month >= 1) AND (recurrence_day_of_month <= 31)))),
    CONSTRAINT reference_tasks_recurrence_days_of_week_check CHECK (((array_length(recurrence_days_of_week, 1) IS NULL) OR ((array_length(recurrence_days_of_week, 1) <= 7) AND (recurrence_days_of_week <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint])))),
    CONSTRAINT reference_tasks_recurrence_week_of_month_check CHECK (((recurrence_week_of_month IS NULL) OR ((recurrence_week_of_month >= 1) AND (recurrence_week_of_month <= 5))))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    journal_id uuid NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    priority double precision DEFAULT 1000.0 NOT NULL,
    reference_task_id uuid,
    scheduled_date date,
    parent_task_id uuid,
    recurrence_type smallint DEFAULT 6,
    missed_at date,
    lexo_priority text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    external_user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: waitlist_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlist_entries (
    id integer NOT NULL,
    email text NOT NULL,
    interest text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: waitlist_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.waitlist_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: waitlist_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.waitlist_entries_id_seq OWNED BY public.waitlist_entries.id;


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: journal_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_streaks ALTER COLUMN id SET DEFAULT nextval('public.journal_streaks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: waitlist_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist_entries ALTER COLUMN id SET DEFAULT nextval('public.waitlist_entries_id_seq'::regclass);


--
-- Name: features features_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_name_key UNIQUE (name);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_streaks journal_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_streaks
    ADD CONSTRAINT journal_streaks_pkey PRIMARY KEY (id);


--
-- Name: journal_streaks journal_streaks_user_id_streak_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_streaks
    ADD CONSTRAINT journal_streaks_user_id_streak_date_key UNIQUE (user_id, streak_date);


--
-- Name: journals journals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_pkey PRIMARY KEY (id);


--
-- Name: reference_tasks reference_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_tasks
    ADD CONSTRAINT reference_tasks_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: journals unique_user_journal_title; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT unique_user_journal_title UNIQUE (user_id, title);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_external_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_external_user_id_key UNIQUE (external_user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlist_entries waitlist_entries_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist_entries
    ADD CONSTRAINT waitlist_entries_email_key UNIQUE (email);


--
-- Name: waitlist_entries waitlist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist_entries
    ADD CONSTRAINT waitlist_entries_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_journal_entries_journal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_journal_id ON public.journal_entries USING btree (journal_id);


--
-- Name: idx_journal_streaks_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_streaks_user_date ON public.journal_streaks USING btree (user_id, streak_date);


--
-- Name: idx_journal_streaks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_streaks_user_id ON public.journal_streaks USING btree (user_id);


--
-- Name: idx_journals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journals_user_id ON public.journals USING btree (user_id);


--
-- Name: idx_journals_user_id_and_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journals_user_id_and_title ON public.journals USING btree (user_id, title);


--
-- Name: idx_reference_tasks_next_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_tasks_next_scheduled_date ON public.reference_tasks USING btree (next_scheduled_date) WHERE (is_active = true);


--
-- Name: idx_reference_tasks_recurrence_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_tasks_recurrence_type ON public.reference_tasks USING btree (recurrence_type);


--
-- Name: idx_reference_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_tasks_user_id ON public.reference_tasks USING btree (user_id);


--
-- Name: idx_reference_tasks_user_next_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_tasks_user_next_scheduled ON public.reference_tasks USING btree (user_id, next_scheduled_date) WHERE (is_active = true);


--
-- Name: idx_tasks_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_completed ON public.tasks USING btree (completed);


--
-- Name: idx_tasks_journal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_journal_id ON public.tasks USING btree (journal_id);


--
-- Name: idx_tasks_parent_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_parent_task_id ON public.tasks USING btree (parent_task_id);


--
-- Name: idx_tasks_lexo_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_lexo_priority ON public.tasks USING btree (lexo_priority);


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- Name: idx_tasks_reference_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_reference_task_id ON public.tasks USING btree (reference_task_id);


--
-- Name: idx_tasks_user_bucketing_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_bucketing_type ON public.tasks USING btree (user_id, recurrence_type, priority);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- Name: idx_tasks_user_missed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_missed_at ON public.tasks USING btree (user_id, missed_at);


--
-- Name: journal_entries journal_entries_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES public.journals(id) ON DELETE CASCADE;


--
-- Name: journal_streaks journal_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_streaks
    ADD CONSTRAINT journal_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: journals journals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reference_tasks reference_tasks_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_tasks
    ADD CONSTRAINT reference_tasks_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES public.journals(id) ON DELETE CASCADE;


--
-- Name: reference_tasks reference_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_tasks
    ADD CONSTRAINT reference_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES public.journals(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_reference_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_reference_task_id_fkey FOREIGN KEY (reference_task_id) REFERENCES public.reference_tasks(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

