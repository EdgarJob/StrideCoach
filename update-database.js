// Script to update the database schema
// Run this in your Supabase SQL editor

const sql = `
-- Add missing columns to workout_plans table
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
ADD COLUMN IF NOT EXISTS preferences JSONB,
ADD COLUMN IF NOT EXISTS weeks JSONB;

-- Update existing records to have default values
UPDATE workout_plans 
SET 
  title = COALESCE(title, 'Workout Plan'),
  description = COALESCE(description, 'Generated workout plan'),
  status = COALESCE(status, 'active'),
  weeks = COALESCE(weeks, plan) -- Move existing plan data to weeks
WHERE title IS NULL OR description IS NULL OR status IS NULL OR weeks IS NULL;

-- Make title and weeks NOT NULL after setting defaults
ALTER TABLE workout_plans 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN weeks SET NOT NULL;

-- Drop the old plan column if it exists and is no longer needed
-- ALTER TABLE workout_plans DROP COLUMN IF EXISTS plan;
`;

console.log('Copy and paste this SQL into your Supabase SQL editor:');
console.log(sql);
