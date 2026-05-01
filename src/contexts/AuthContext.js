import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
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
  const [passwordRecovery, setPasswordRecovery] = useState(false);

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
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false);
      }

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
        setLoading(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [loading]);

  const getAuthRedirectUrl = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.origin;
    }
    return Linking.createURL('/');
  };

  // Load user profile from database
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        await createBasicProfile(userId);
        return;
      }

      setProfile(data);
    } catch (error) {
      await createBasicProfile(userId);
    }
  };

  // Create basic profile if it doesn't exist
  const createBasicProfile = async (userId) => {
    try {
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
        if (error.code === '23505' || error.status === 409) {
          await loadUserProfile(userId);
          return;
        }
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
        setProfile(data);
      }
    } catch (error) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        throw error;
      }

      // Create profile if signup successful
      if (data.user) {
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
          // Profile creation failed but don't block signup
        }
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // OAuth Sign in with Google or Apple
  const signInWithOAuth = async (provider) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setPasswordRecovery(false);
        await loadUserProfile(data.user.id);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updatePassword = async (password) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setPasswordRecovery(false);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);

      setUser(null);
      setProfile(null);
      setPasswordRecovery(false);

      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
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
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    passwordRecovery,
    signUp,
    signIn,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
