-- Fix stale next_scheduled_date values that got corrupted by V11 bugs
-- This handles reference tasks where next_scheduled_date is in the past

UPDATE reference_tasks
SET next_scheduled_date = calculate_next_scheduled_date(
    int_to_recurrence_type_enum(recurrence_type),
    recurrence_interval,
    recurrence_days_of_week,
    recurrence_day_of_month,
    starts_on,
    ends_on,
    CURRENT_DATE
)
WHERE is_active = true 
AND next_scheduled_date IS NOT NULL
AND next_scheduled_date < CURRENT_DATE
AND (ends_on IS NULL OR ends_on >= CURRENT_DATE);

-- Also update any that have NULL next_scheduled_date but should be active
UPDATE reference_tasks
SET next_scheduled_date = calculate_next_scheduled_date(
    int_to_recurrence_type_enum(recurrence_type),
    recurrence_interval,
    recurrence_days_of_week,
    recurrence_day_of_month,
    starts_on,
    ends_on,
    CURRENT_DATE
)
WHERE is_active = true 
AND next_scheduled_date IS NULL
AND (ends_on IS NULL OR ends_on >= CURRENT_DATE);
