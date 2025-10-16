// Diagnose database issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabase() {
  console.log('🔍 Diagnosing Database Issues...\n');

  try {
    // Test 1: Try the exact query that's failing
    console.log('1. Testing the failing query...');
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', '535d444c-bae9-4927-b911-a27bd929e932')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log('   ❌ Query failed:', error.message);
      console.log('   📋 Error code:', error.code);
      console.log('   📋 Error details:', error.details);
    } else {
      console.log('   ✅ Query successful');
      console.log('   📊 Data:', data);
    }

    // Test 2: Try a simpler query
    console.log('\n2. Testing simple query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('workout_plans')
      .select('id, title')
      .limit(1);

    if (simpleError) {
      console.log('   ❌ Simple query failed:', simpleError.message);
    } else {
      console.log('   ✅ Simple query successful');
    }

    // Test 3: Check if we can insert
    console.log('\n3. Testing insert...');
    const testPlan = {
      user_id: '535d444c-bae9-4927-b911-a27bd929e932',
      title: 'Test Plan',
      description: 'Test Description',
      start_date: '2024-01-01',
      end_date: '2024-01-28',
      status: 'active',
      preferences: {},
      weeks: { week1: [], week2: [], week3: [], week4: [] }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('workout_plans')
      .insert([testPlan])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
      console.log('   📋 Error code:', insertError.code);
    } else {
      console.log('   ✅ Insert successful');
      
      // Clean up
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', insertData.id);
      console.log('   🧹 Test record cleaned up');
    }

  } catch (err) {
    console.log('   ❌ Unexpected error:', err.message);
  }

  console.log('\n🎯 Diagnosis Complete!');
  console.log('   - If queries fail with 406, the database schema needs updating');
  console.log('   - If insert fails, there might be RLS policy issues');
  console.log('   - Run the SQL from FINAL_DATABASE_FIX.md to fix these issues');
}

diagnoseDatabase().catch(console.error);
