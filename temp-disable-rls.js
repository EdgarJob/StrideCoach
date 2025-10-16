// Temporarily disable RLS for testing
const sql = `
-- Temporarily disable RLS to test if the app works
ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;

-- Test if this fixes the issue
SELECT 'RLS disabled for workout_plans table' as status;
`;

console.log('🔧 Temporary RLS Disable:');
console.log('Copy and paste this into your Supabase SQL Editor:');
console.log(sql);
console.log('\n⚠️  This will temporarily disable security - only for testing!');
console.log('✅ After testing, we can re-enable it with proper policies.');
