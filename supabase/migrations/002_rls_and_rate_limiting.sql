-- Migration: Enable RLS and create ai_events table for rate limiting and logging

-- 1. Create ai_events table for tracking AI usage
CREATE TABLE IF NOT EXISTS ai_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('plan', 'chat', 'motivation')),
  provider TEXT DEFAULT 'openai',
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ai_events
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own AI events
CREATE POLICY "Users can view own ai_events"
  ON ai_events FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own AI events
CREATE POLICY "Users can insert own ai_events"
  ON ai_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Enable RLS on profiles table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Enable RLS on workout_plans table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can view own plans'
  ) THEN
    ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own plans"
      ON workout_plans FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own plans"
      ON workout_plans FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own plans"
      ON workout_plans FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own plans"
      ON workout_plans FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Enable RLS on workout_sessions table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'Users can view own sessions'
  ) THEN
    ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own sessions"
      ON workout_sessions FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own sessions"
      ON workout_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own sessions"
      ON workout_sessions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Enable RLS on health_daily table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'health_daily' AND policyname = 'Users can view own health'
  ) THEN
    ALTER TABLE health_daily ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own health"
      ON health_daily FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own health"
      ON health_daily FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own health"
      ON health_daily FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Enable RLS on measurements table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'measurements' AND policyname = 'Users can view own measurements'
  ) THEN
    ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own measurements"
      ON measurements FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own measurements"
      ON measurements FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own measurements"
      ON measurements FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index for faster rate limiting queries
CREATE INDEX IF NOT EXISTS idx_ai_events_user_kind_created 
  ON ai_events(user_id, kind, created_at);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_ai_events_user_id 
  ON ai_events(user_id);

-- Comment
COMMENT ON TABLE ai_events IS 'Tracks AI API usage for rate limiting and cost monitoring';
COMMENT ON COLUMN ai_events.kind IS 'Type of AI request: plan, chat, or motivation';
COMMENT ON COLUMN ai_events.cost_usd IS 'Estimated cost in USD';

