import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Create the Auth Context
const AuthContext = createContext({});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false); // Set loading to false immediately
      
      // Load profile in background without blocking UI
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); // Set loading to false immediately
      
      // Load profile in background without blocking UI
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [loading]);

  // Load user profile from database
  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        // If profile doesn't exist, create a basic one
        console.log('Profile not found, creating basic profile...');
        await createBasicProfile(userId);
        return;
      }

      console.log('Profile loaded successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Create a basic profile if loading fails
      console.log('Creating basic profile due to error...');
      await createBasicProfile(userId);
    }
  };

  // Create basic profile if it doesn't exist
  const createBasicProfile = async (userId) => {
    try {
      console.log('Creating basic profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: 'New User',
          sex: 'male',
          age: 25,
          height_cm: 175,
          weight_kg: 70,
          goal: {
            type: 'weight_loss',
            target_weight: 65,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '17:00',
            durations: { walk_min: 60, strength_min: 30 }
          },
          mode: 'walk_plus_strength',
          equipment: ['none'],
          consent: {
            health_data: true,
            ai_coaching: true,
            analytics: true
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating basic profile:', error);
        // Set a default profile even if creation fails
        setProfile({
          user_id: userId,
          display_name: 'New User',
          sex: 'male',
          age: 25,
          height_cm: 175,
          weight_kg: 70,
          goal: { type: 'weight_loss', target_weight: 65 },
          schedule: { days: ['Monday', 'Wednesday', 'Friday'], time: '17:00' },
          mode: 'walk_plus_strength',
          equipment: ['none'],
          consent: { health_data: true, ai_coaching: true, analytics: true }
        });
      } else {
        console.log('Basic profile created:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating basic profile:', error);
      // Set a default profile even if creation fails
      setProfile({
        user_id: userId,
        display_name: 'New User',
        sex: 'male',
        age: 25,
        height_cm: 175,
        weight_kg: 70,
        goal: { type: 'weight_loss', target_weight: 65 },
        schedule: { days: ['Monday', 'Wednesday', 'Friday'], time: '17:00' },
        mode: 'walk_plus_strength',
        equipment: ['none'],
        consent: { health_data: true, ai_coaching: true, analytics: true }
      });
    }
  };

  // Sign up function
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      console.log('Starting signup process...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw error;
      }

      console.log('Auth signup successful:', data);

      // Create profile if signup successful
      if (data.user) {
        console.log('Creating user profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            display_name: userData.display_name,
            sex: userData.sex,
            age: userData.age,
            height_cm: userData.height_cm,
            weight_kg: userData.weight_kg,
            goal: userData.goal,
            schedule: userData.schedule,
            mode: userData.mode || 'walk_only',
            equipment: userData.equipment || ['none'],
            consent: userData.consent || {},
          })
          .select();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't throw error here, just log it
        } else {
          console.log('Profile created successfully:', profileData);
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('Starting sign in process...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth sign in error:', error);
        throw error;
      }

      console.log('Auth sign in successful:', data);
      
      // Load user profile after successful sign in
      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      // Clear user and profile state immediately
      setUser(null);
      setProfile(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload profile
      await loadUserProfile(user.id);

      return { data, error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
