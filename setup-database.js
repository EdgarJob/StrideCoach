// Database Setup Script for StrideCoach
// This script will create all the necessary tables in your Supabase database

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up StrideCoach database...');
  
  try {
    // Read the SQL schema file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'supabase-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          // Continue with other statements even if one fails
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Database setup completed!');
    console.log('📱 You can now test your app with authentication!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy and paste the contents of supabase-schema.sql');
    console.log('5. Click "Run" to execute the SQL');
  }
}

// Run the setup
setupDatabase();
