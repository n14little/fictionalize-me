-- Remove slug column from journals table as it's not being used
-- This simplifies the schema and eliminates unnecessary complexity

-- Drop any slug-related constraints first
ALTER TABLE journals
DROP CONSTRAINT IF EXISTS journals_user_id_slug_key;

ALTER TABLE journals DROP CONSTRAINT IF EXISTS journals_slug_key;

-- Drop the slug index
DROP INDEX IF EXISTS idx_journals_slug;

-- Remove the slug column
ALTER TABLE journals DROP COLUMN IF EXISTS slug;