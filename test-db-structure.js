// Test database structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseStructure() {
  console.log('🔍 Testing Database Structure...\n');

  try {
    // Test 1: Check if we can query the table
    console.log('1. Testing basic table access...');
    const { data, error } = await supabase
      .from('workout_plans')
      .select('id, title, status')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Error:', error.message);
      if (error.message.includes('column "status" does not exist')) {
        console.log('   📋 The status column is missing - run the SQL migration');
      } else if (error.message.includes('column "title" does not exist')) {
        console.log('   📋 The title column is missing - run the SQL migration');
      }
    } else {
      console.log('   ✅ Table accessible');
    }

    // Test 2: Try to insert a test record
    console.log('\n2. Testing insert capability...');
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
      console.log('   ❌ Insert error:', insertError.message);
      if (insertError.message.includes('column "plan"')) {
        console.log('   📋 The old "plan" column still exists and is required');
        console.log('   📋 Run the final database fix SQL');
      }
    } else {
      console.log('   ✅ Insert successful');
      
      // Clean up test record
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', insertData.id);
      console.log('   🧹 Test record cleaned up');
    }

  } catch (err) {
    console.log('   ❌ Unexpected error:', err.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. Run the SQL from fix-database-final.js in Supabase');
  console.log('   2. Test the app again');
}

testDatabaseStructure().catch(console.error);
