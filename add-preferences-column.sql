-- Add workout_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN workout_preferences JSONB DEFAULT '{}';

-- Update existing profiles to have empty preferences object
UPDATE profiles 
SET workout_preferences = '{}' 
WHERE workout_preferences IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.workout_preferences IS 'User workout preferences including types, days, duration, difficulty, goals, equipment, and timing';
