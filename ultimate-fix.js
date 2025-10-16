// Ultimate database fix
const sql = `
-- Step 1: Check current state
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'workout_plans';

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Users can insert own workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Users can update own workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Users can delete own workout plans" ON workout_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON workout_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON workout_plans;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON workout_plans;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON workout_plans;

-- Step 3: Temporarily disable RLS to test
ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;

-- Step 4: Re-enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Step 5: Create new policies with explicit permissions
CREATE POLICY "workout_plans_select_policy" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "workout_plans_insert_policy" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_plans_update_policy" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "workout_plans_delete_policy" ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Verify policies were created
SELECT 'New policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'workout_plans';

-- Step 7: Test the policies work
SELECT 'Testing policies...' as info;
`;

console.log('🔧 Ultimate Database Fix:');
console.log('Copy and paste this into your Supabase SQL Editor:');
console.log(sql);
