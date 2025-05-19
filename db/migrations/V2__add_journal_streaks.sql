-- Add Journal Streaks Table
CREATE TABLE journal_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Add a unique constraint to prevent multiple records for the same user on the same day
  UNIQUE (user_id, streak_date)
);

-- Create an index for faster lookups by user_id
CREATE INDEX idx_journal_streaks_user_id ON journal_streaks(user_id);

-- Create a composite index for user_id and date lookups
CREATE INDEX idx_journal_streaks_user_date ON journal_streaks(user_id, streak_date);