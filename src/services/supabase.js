import { createClient } from '@supabase/supabase-js';

// These will be your actual Supabase project credentials
// We'll get these from your Supabase dashboard
const supabaseUrl = 'https://mgbkrotqvafroqprmpik.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmtyb3RxdmFmcm9xcHJtcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0ODQ1NTcsImV4cCI6MjA3NjA2MDU1N30.PgOysnqd04bfekjk1a37V7ft4pMvy-ZrVYRknGoYCwg';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names (we'll create these in Supabase)
export const TABLES = {
  PROFILES: 'profiles',
  MEASUREMENTS: 'measurements',
  HEALTH_DAILY: 'health_daily',
  WORKOUT_PLANS: 'workout_plans',
  WORKOUT_SESSIONS: 'workout_sessions',
  AI_EVENTS: 'ai_events',
};

// Helper functions for common operations
export const auth = {
  // Sign up a new user
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // Additional user data like name, age, etc.
      },
    });
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },
};

// Helper functions for data operations
export const data = {
  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('user_id', userId);
    return { data, error };
  },

  // Get health data for a date range
  getHealthData: async (userId, startDate, endDate) => {
    const { data, error } = await supabase
      .from(TABLES.HEALTH_DAILY)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },

  // Insert daily health data
  insertHealthData: async (healthData) => {
    const { data, error } = await supabase
      .from(TABLES.HEALTH_DAILY)
      .upsert(healthData);
    return { data, error };
  },

  // Get workout sessions
  getWorkoutSessions: async (userId, startDate, endDate) => {
    const { data, error } = await supabase
      .from(TABLES.WORKOUT_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    return { data, error };
  },
};

export default supabase;
