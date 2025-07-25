-- Add unique constraint to prevent duplicate journal titles per user
-- This will help eliminate race conditions in journal creation

ALTER TABLE journals
ADD CONSTRAINT unique_user_journal_title UNIQUE (user_id, title);