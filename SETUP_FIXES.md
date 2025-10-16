# 🔧 Setup Fixes for StrideCoach

## Issue 1: OpenAI API Key

1. **Get your OpenAI API Key:**
   - Go to https://platform.openai.com/account/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-proj-`)

2. **Set the API Key:**
   - Open the `.env` file in your project root
   - Replace `your-openai-api-key-here` with your actual API key
   - Save the file

## Issue 2: Database Schema Update

1. **Go to your Supabase Dashboard:**
   - Open https://supabase.com/dashboard
   - Select your StrideCoach project
   - Go to "SQL Editor"

2. **Run this SQL:**
   ```sql
   -- Add missing columns to workout_plans table
   ALTER TABLE workout_plans 
   ADD COLUMN IF NOT EXISTS title TEXT,
   ADD COLUMN IF NOT EXISTS description TEXT,
   ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
   ADD COLUMN IF NOT EXISTS preferences JSONB,
   ADD COLUMN IF NOT EXISTS weeks JSONB;

   -- Update existing records to have default values
   UPDATE workout_plans 
   SET 
     title = COALESCE(title, 'Workout Plan'),
     description = COALESCE(description, 'Generated workout plan'),
     status = COALESCE(status, 'active'),
     weeks = COALESCE(weeks, plan) -- Move existing plan data to weeks
   WHERE title IS NULL OR description IS NULL OR status IS NULL OR weeks IS NULL;

   -- Make title and weeks NOT NULL after setting defaults
   ALTER TABLE workout_plans 
   ALTER COLUMN title SET NOT NULL,
   ALTER COLUMN weeks SET NOT NULL;
   ```

3. **Click "Run" to execute the SQL**

## After Setup

1. **Restart your development server:**
   ```bash
   npx expo start --web
   ```

2. **Test the app:**
   - The AI Coach should work with your API key
   - The Plans tab should work without database errors
   - You can generate workout plans

## What These Fixes Do

- **API Key Fix:** Enables AI Coach functionality
- **Database Fix:** Adds missing columns for workout plans
- **App Functionality:** Allows you to create and manage workout plans

Your StrideCoach app should now work perfectly! 🎉
