// Final database fix script
const sql = `
-- First, let's check what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workout_plans' 
ORDER BY ordinal_position;

-- If the old 'plan' column still exists and is NOT NULL, we need to:
-- 1. Make it nullable temporarily
-- 2. Update existing records to have data in the new 'weeks' column
-- 3. Drop the old 'plan' column

-- Step 1: Make the old 'plan' column nullable
ALTER TABLE workout_plans ALTER COLUMN plan DROP NOT NULL;

-- Step 2: Update existing records to move data from 'plan' to 'weeks' if needed
UPDATE workout_plans 
SET weeks = COALESCE(weeks, plan)
WHERE weeks IS NULL AND plan IS NOT NULL;

-- Step 3: Now we can safely drop the old 'plan' column
ALTER TABLE workout_plans DROP COLUMN IF EXISTS plan;

-- Step 4: Ensure all new columns have proper defaults
UPDATE workout_plans 
SET 
  title = COALESCE(title, 'Workout Plan'),
  description = COALESCE(description, 'Generated workout plan'),
  status = COALESCE(status, 'active')
WHERE title IS NULL OR description IS NULL OR status IS NULL;

-- Step 5: Make sure the required columns are NOT NULL
ALTER TABLE workout_plans 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN weeks SET NOT NULL;
`;

console.log('🔧 Final Database Fix SQL:');
console.log('Copy and paste this into your Supabase SQL Editor:');
console.log(sql);
