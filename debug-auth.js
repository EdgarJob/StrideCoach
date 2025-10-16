// Debug authentication and user ID issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issues...\n');

  try {
    // Test 1: Check current user
    console.log('1. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('   ❌ User error:', userError.message);
    } else if (user) {
      console.log('   ✅ User found:', user.id);
      console.log('   📊 User email:', user.email);
    } else {
      console.log('   ❌ No user found - not authenticated');
    }

    // Test 2: Try to insert with the exact user ID from the error
    console.log('\n2. Testing insert with known user ID...');
    const testUserId = '535d444c-bae9-4927-b911-a27bd929e932';
    const testPlan = {
      user_id: testUserId,
      title: 'Debug Test Plan',
      description: 'Testing RLS policy',
      start_date: '2024-01-01',
      end_date: '2024-01-28',
      status: 'active',
      preferences: { goal: 'debug' },
      weeks: { 
        week1: [{ day: 'Monday', type: 'walk', duration: 30 }]
      }
    };

    console.log('   📊 Using user_id:', testUserId);
    console.log('   📊 Auth user ID:', user?.id);
    console.log('   📊 IDs match:', user?.id === testUserId);

    const { data: newPlan, error: insertError } = await supabase
      .from('workout_plans')
      .insert([testPlan])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
      console.log('   📋 Error code:', insertError.code);
      console.log('   📋 Error details:', insertError.details);
    } else {
      console.log('   ✅ Insert successful!');
      
      // Clean up
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', newPlan.id);
      console.log('   🧹 Test plan cleaned up');
    }

    // Test 3: Check if we can query the user's plans
    console.log('\n3. Testing query with user ID...');
    const { data: plans, error: queryError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', testUserId);

    if (queryError) {
      console.log('   ❌ Query failed:', queryError.message);
    } else {
      console.log('   ✅ Query successful');
      console.log('   📊 Found', plans.length, 'plans for user');
    }

  } catch (err) {
    console.log('   ❌ Unexpected error:', err.message);
  }

  console.log('\n🎯 Debug Results:');
  console.log('   - If user ID mismatch, that explains the RLS failure');
  console.log('   - If insert works, the policy is correct');
  console.log('   - If query works but insert fails, there might be a policy issue');
}

debugAuth().catch(console.error);
