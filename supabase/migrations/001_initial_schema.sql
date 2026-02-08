-- Migration 001: Initial Schema for StrideCoach-v2
-- Creates all core tables: profiles, measurements, health_daily, workout_plans, workout_sessions

-- Enable UUID extension (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- Stores user profile data linked to Supabase auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'New User',
  sex TEXT DEFAULT 'male' CHECK (sex IN ('male', 'female', 'other')),
  age INTEGER CHECK (age > 0 AND age < 150),
  height_cm DECIMAL(5, 1),
  weight_kg DECIMAL(5, 1),
  goal JSONB DEFAULT '{"type": "weight_loss", "target_weight": 65}'::jsonb,
  schedule JSONB DEFAULT '{"days": ["Monday", "Wednesday", "Friday"], "time": "17:00"}'::jsonb,
  mode TEXT DEFAULT 'walk_plus_strength',
  equipment JSONB DEFAULT '["none"]'::jsonb,
  consent JSONB DEFAULT '{"health_data": true, "ai_coaching": true, "analytics": true}'::jsonb,
  workout_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================================
-- 2. MEASUREMENTS
-- Stores body measurements over time
-- ============================================================
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5, 1),
  body_fat_pct DECIMAL(4, 1),
  chest_cm DECIMAL(5, 1),
  waist_cm DECIMAL(5, 1),
  hips_cm DECIMAL(5, 1),
  bicep_cm DECIMAL(5, 1),
  thigh_cm DECIMAL(5, 1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user measurements
CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_created ON measurements(user_id, created_at);

-- ============================================================
-- 3. HEALTH_DAILY
-- Daily health metrics (steps, sleep, heart rate, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS health_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  distance DECIMAL(8, 2),
  active_minutes INTEGER DEFAULT 0,
  sleep_hours DECIMAL(4, 1),
  heart_rate INTEGER,
  hrv INTEGER,
  weight DECIMAL(5, 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for health data queries
CREATE INDEX IF NOT EXISTS idx_health_daily_user_id ON health_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_health_daily_user_date ON health_daily(user_id, date);

-- ============================================================
-- 4. WORKOUT_PLANS
-- Stores generated 4-week workout plans (JSONB for weeks data)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Workout Plan',
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  preferences JSONB,
  weeks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workout plans
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_status ON workout_plans(user_id, status);

-- ============================================================
-- 5. WORKOUT_SESSIONS
-- Individual workout sessions (logged completions)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  workout_data JSONB,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workout sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan_id ON workout_sessions(plan_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
