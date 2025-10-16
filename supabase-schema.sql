-- StrideCoach Database Schema
-- This file contains all the SQL commands to create the database structure

-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data

-- 1. Profiles Table
-- Stores user profile information
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  age INTEGER CHECK (age > 0 AND age < 150),
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  goal JSONB, -- Stores goal information like target weight, deadline
  schedule JSONB, -- Stores workout schedule preferences
  mode TEXT CHECK (mode IN ('walk_only', 'walk_plus_strength')),
  equipment JSONB, -- Available equipment
  consent JSONB, -- User consent for data usage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Measurements Table
-- Stores body measurements over time
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  waist_cm DECIMAL(5,2),
  hips_cm DECIMAL(5,2),
  chest_cm DECIMAL(5,2),
  thigh_cm DECIMAL(5,2),
  neck_cm DECIMAL(5,2),
  source TEXT CHECK (source IN ('manual', 'health_kit', 'google_fit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Health Daily Table
-- Stores daily health metrics from phone/watch
CREATE TABLE health_daily (
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  date DATE,
  steps INTEGER DEFAULT 0,
  distance_km DECIMAL(8,2) DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  resting_hr INTEGER,
  avg_hr INTEGER,
  hrv_ms DECIMAL(6,2),
  sleep_minutes INTEGER,
  sleep_efficiency DECIMAL(3,2),
  weight_kg DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- 4. Workout Plans Table
-- Stores AI-generated workout plans
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  preferences JSONB, -- User preferences for the plan
  weeks JSONB NOT NULL, -- The full workout plan structure with weeks
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Workout Sessions Table
-- Stores individual workout sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('walk', 'strength', 'rest')),
  target JSONB, -- Target parameters for the session
  status TEXT CHECK (status IN ('planned', 'inferred_done', 'skipped', 'user_done')),
  feedback TEXT, -- User feedback about difficulty
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. AI Events Table
-- Tracks AI usage for cost monitoring
CREATE TABLE ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('plan', 'adapt', 'chat')),
  provider TEXT DEFAULT 'openai',
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only access their own data

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Measurements policies
CREATE POLICY "Users can view own measurements" ON measurements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements" ON measurements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements" ON measurements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements" ON measurements
  FOR DELETE USING (auth.uid() = user_id);

-- Health daily policies
CREATE POLICY "Users can view own health data" ON health_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data" ON health_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health data" ON health_daily
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout plans policies
CREATE POLICY "Users can view own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout sessions policies
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- AI events policies
CREATE POLICY "Users can view own AI events" ON ai_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI events" ON ai_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_measurements_user_date ON measurements(user_id, taken_at DESC);
CREATE INDEX idx_health_daily_user_date ON health_daily(user_id, date DESC);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_workout_plans_user_dates ON workout_plans(user_id, start_date, end_date);
CREATE INDEX idx_ai_events_user_created ON ai_events(user_id, created_at DESC);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic updated_at updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_daily_updated_at BEFORE UPDATE ON health_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
