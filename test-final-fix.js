// Test if everything is working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalFix() {
  console.log('🧪 Testing Final Fix...\n');

  try {
    // Test 1: Check if we can query plans
    console.log('1. Testing plan query...');
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', '535d444c-bae9-4927-b911-a27bd929e932')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (plansError) {
      console.log('   ❌ Query failed:', plansError.message);
    } else {
      console.log('   ✅ Query successful');
      console.log('   📊 Found', plans.length, 'plans');
    }

    // Test 2: Try to create a test plan
    console.log('\n2. Testing plan creation...');
    const testPlan = {
      user_id: '535d444c-bae9-4927-b911-a27bd929e932',
      title: 'Test Plan - ' + new Date().toISOString(),
      description: 'Test Description',
      start_date: '2024-01-01',
      end_date: '2024-01-28',
      status: 'active',
      preferences: { goal: 'test' },
      weeks: { 
        week1: [{ day: 'Monday', type: 'walk', duration: 30 }],
        week2: [{ day: 'Monday', type: 'walk', duration: 35 }],
        week3: [{ day: 'Monday', type: 'walk', duration: 40 }],
        week4: [{ day: 'Monday', type: 'walk', duration: 45 }]
      }
    };

    const { data: newPlan, error: insertError } = await supabase
      .from('workout_plans')
      .insert([testPlan])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
      console.log('   📋 Error code:', insertError.code);
    } else {
      console.log('   ✅ Insert successful!');
      console.log('   📊 Created plan:', newPlan.title);
      
      // Clean up test record
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', newPlan.id);
      console.log('   🧹 Test plan cleaned up');
    }

    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'workout_plans' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (policyError) {
      console.log('   ⚠️  Cannot check policies directly (this is normal)');
    } else {
      console.log('   ✅ Policies check completed');
    }

  } catch (err) {
    console.log('   ❌ Unexpected error:', err.message);
  }

  console.log('\n🎯 Test Results:');
  console.log('   - If both query and insert show ✅, your app is fully working!');
  console.log('   - If insert still fails, the RLS policies need to be fixed');
  console.log('   - If query fails, there might be a different issue');
}

testFinalFix().catch(console.error);
