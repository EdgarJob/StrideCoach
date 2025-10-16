# Supabase Setup Instructions

## Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with your email or GitHub
4. Create a new project:
   - **Name**: `stridecoach`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing**: Free tier

## Step 2: Get Your Credentials
1. Go to your Supabase project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" in the settings menu
4. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Update Your App Configuration
1. Open `src/services/supabase.js`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Anon public key

## Step 4: Set Up Database Tables
1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to create all tables and policies

## Step 5: Test Your App
1. Restart your development server: `npx expo start --web`
2. You should now see a login/signup screen
3. Try creating a new account!

## What This Sets Up:
- ✅ User authentication (sign up, sign in, sign out)
- ✅ User profiles with health data
- ✅ Secure database with user-specific data access
- ✅ All the tables needed for StrideCoach features

## Next Steps:
Once Supabase is set up, we'll add:
- OpenAI integration for AI coaching
- Health data integration
- Workout plan generation
- Real-time data updates
