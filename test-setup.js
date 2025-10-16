// Test script to verify setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSetup() {
  console.log('🔍 Testing StrideCoach Setup...\n');

  // Test 1: Check API Key
  console.log('1. Testing OpenAI API Key...');
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (apiKey && apiKey !== 'your-openai-api-key-here') {
    console.log('   ✅ API Key is set');
  } else {
    console.log('   ❌ API Key not set properly');
  }

  // Test 2: Check Database Schema
  console.log('\n2. Testing Database Schema...');
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('id, title, status')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "status" does not exist')) {
        console.log('   ❌ Database schema needs update - missing status column');
        console.log('   📋 Run the SQL from SETUP_FIXES.md in your Supabase dashboard');
      } else {
        console.log('   ❌ Database error:', error.message);
      }
    } else {
      console.log('   ✅ Database schema looks good');
    }
  } catch (err) {
    console.log('   ❌ Database connection error:', err.message);
  }

  // Test 3: Check if tables exist
  console.log('\n3. Testing Database Tables...');
  try {
    const { data: profiles } = await supabase.from('profiles').select('count').limit(1);
    const { data: plans } = await supabase.from('workout_plans').select('count').limit(1);
    console.log('   ✅ Database tables accessible');
  } catch (err) {
    console.log('   ❌ Database tables error:', err.message);
  }

  console.log('\n🎯 Setup Status:');
  console.log('   - If all tests show ✅, your app should work perfectly!');
  console.log('   - If any show ❌, follow the instructions in SETUP_FIXES.md');
}

testSetup().catch(console.error);
