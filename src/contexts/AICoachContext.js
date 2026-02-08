import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiCoach } from '../services/aiService';
import { useAuth } from './AuthContext';
import { usePlan } from './PlanContext';

const AICoachContext = createContext();
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const normalizeAvailableDays = (days) => {
  const normalized = {};
  DAY_KEYS.forEach((dayKey) => {
    normalized[dayKey] = Boolean(days?.[dayKey]);
  });
  return normalized;
};

const getCurrentAvailableDays = (plan) => {
  if (plan?.preferences?.availableDays) {
    return normalizeAvailableDays(plan.preferences.availableDays);
  }

  const derivedDays = normalizeAvailableDays({});
  if (Array.isArray(plan?.weeks)) {
    plan.weeks.forEach((week) => {
      if (!Array.isArray(week?.days)) return;
      week.days.forEach((day) => {
        const key = day?.day_name?.toLowerCase?.();
        if (DAY_KEYS.includes(key)) {
          derivedDays[key] = true;
        }
      });
    });
  }

  return derivedDays;
};

const getSelectedDayLabels = (days) => DAY_KEYS
  .filter((dayKey) => Boolean(days?.[dayKey]))
  .map((dayKey) => DAY_LABELS[dayKey]);

const buildAvailableDayPreview = (plan, preferenceUpdates = {}) => {
  if (!preferenceUpdates?.availableDays || typeof preferenceUpdates.availableDays !== 'object') {
    return null;
  }

  const currentDays = getCurrentAvailableDays(plan);
  const proposedDays = normalizeAvailableDays({
    ...currentDays,
    ...preferenceUpdates.availableDays
  });

  const currentLabels = getSelectedDayLabels(currentDays);
  const proposedLabels = getSelectedDayLabels(proposedDays);

  return {
    currentCount: currentLabels.length,
    proposedCount: proposedLabels.length,
    currentDays: currentLabels,
    proposedDays: proposedLabels
  };
};

export const useAICoach = () => {
  const context = useContext(AICoachContext);
  if (!context) {
    throw new Error('useAICoach must be used within an AICoachProvider');
  }
  return context;
};

export const AICoachProvider = ({ children }) => {
  const { profile } = useAuth();
  const { currentPlan, applyCoachPlanUpdate } = usePlan();
  
  const [isLoading, setIsLoading] = useState(false);
  const [dailyMotivation, setDailyMotivation] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [motivationLoadedToday, setMotivationLoadedToday] = useState(false);
  const [pendingPlanAction, setPendingPlanAction] = useState(null);
  const [isApplyingPlanAction, setIsApplyingPlanAction] = useState(false);
  
  // Use refs to avoid dependency issues
  const dailyMotivationRef = useRef('');
  const motivationLoadedTodayRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    dailyMotivationRef.current = dailyMotivation;
  }, [dailyMotivation]);

  useEffect(() => {
    motivationLoadedTodayRef.current = motivationLoadedToday;
  }, [motivationLoadedToday]);

  // Load daily motivation with progress data (memoized to prevent re-renders)
  const loadDailyMotivation = useCallback(async (progressData = null) => {
    if (!profile) return;

    const today = new Date().toDateString();
    let lastMotivationDate = null;

    try {
      lastMotivationDate = await AsyncStorage.getItem('lastMotivationDate');
    } catch (error) {
      // AsyncStorage not available, use memory fallback
    }

    if ((lastMotivationDate === today && dailyMotivationRef.current) || motivationLoadedTodayRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await aiCoach.getDailyMotivation(profile, progressData);

      if (result.success) {
        setDailyMotivation(result.motivation);
        setMotivationLoadedToday(true);
        const now = new Date();
        const timeString = now.toTimeString();
        try {
          await AsyncStorage.setItem('lastMotivationDate', today);
          await AsyncStorage.setItem('lastMotivationTime', timeString);
        } catch (error) {
          // Could not save to storage
        }
      } else {
        setDailyMotivation("Ready to make today count? Every step brings you closer to your goals!");
      }
    } catch (error) {
      setDailyMotivation("Ready to make today count? Every step brings you closer to your goals!");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Auto-load motivation at 7am or on first visit after 7am
  useEffect(() => {
    if (!profile) return;

    const checkAndLoadMotivation = async () => {
      const now = new Date();
      const today = now.toDateString();
      const currentHour = now.getHours();

      let lastMotivationDate = null;
      try {
        lastMotivationDate = await AsyncStorage.getItem('lastMotivationDate');
      } catch (error) {
        // AsyncStorage not available
      }

      // Reset flag if it's a new day
      if (lastMotivationDate !== today) {
        setMotivationLoadedToday(false);
        motivationLoadedTodayRef.current = false;
      }

      if (lastMotivationDate !== today && currentHour >= 7 && !motivationLoadedTodayRef.current) {
        loadDailyMotivation(null);
      }
    };

    checkAndLoadMotivation();

    const interval = setInterval(checkAndLoadMotivation, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile, loadDailyMotivation]);

  // Send message to AI coach (wrapped in useCallback)
  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || !profile) return;

    try {
      setIsLoading(true);
      
      // Add user message to local history immediately
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, userMessage]);

      // Get AI response with plan and preferences context
      const result = await aiCoach.chatWithCoach(message, profile, currentPlan);
      
      if (result.success) {
        if (result.planAction?.type === 'propose_plan_update') {
          const dayPreview = buildAvailableDayPreview(currentPlan, result.planAction.preferenceUpdates || {});
          setPendingPlanAction({
            type: 'propose_plan_update',
            summary: result.planAction.summary || 'Plan updates requested',
            confirmationPrompt: result.planAction.confirmationPrompt || 'Do you want me to apply these plan updates?',
            preferenceUpdates: result.planAction.preferenceUpdates || {},
            userRequestText: message,
            dayPreview
          });
        }

        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.message,
          timestamp: new Date()
        };
        
        setConversationHistory(prev => [...prev, aiMessage]);
        return {
          success: true,
          message: result.message,
          planAction: result.planAction || null
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      
      setConversationHistory(prev => [...prev, errorMessage]);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile, currentPlan]);

  // Confirm and apply the pending plan update proposed by AI coach
  const confirmPendingPlanAction = useCallback(async () => {
    if (!pendingPlanAction || pendingPlanAction.type !== 'propose_plan_update') {
      return { success: false, error: 'No pending plan action to confirm' };
    }

    const hadCurrentPlan = Boolean(currentPlan?.id);

    try {
      setIsApplyingPlanAction(true);

      const result = await applyCoachPlanUpdate(
        pendingPlanAction.preferenceUpdates || {},
        pendingPlanAction.summary || '',
        { userRequestText: pendingPlanAction.userRequestText || '' }
      );

      if (!result.success) {
        throw new Error(result.error || 'Unable to apply plan updates');
      }

      const confirmationMessage = hadCurrentPlan
        ? 'I updated your current workout plan and saved the changes.'
        : 'I created a new workout plan with those changes and saved it.';

      const safetyMessage = result.daySafety?.adjusted
        ? ` I kept it at ${result.daySafety.finalCount} workout days per week to avoid an unrealistic drop. If you want fewer days, say "only X days per week".`
        : '';

      const aiMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `${confirmationMessage}${safetyMessage}`,
        timestamp: new Date()
      };

      aiCoach.conversationHistory.push({
        role: 'assistant',
        content: `${confirmationMessage}${safetyMessage}`
      });

      setConversationHistory(prev => [...prev, aiMessage]);
      setPendingPlanAction(null);
      return { success: true, plan: result.plan };
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `I couldn't apply those plan changes: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };

      setConversationHistory(prev => [...prev, errorMessage]);
      return { success: false, error: error.message };
    } finally {
      setIsApplyingPlanAction(false);
    }
  }, [pendingPlanAction, currentPlan, applyCoachPlanUpdate]);

  // Dismiss the pending plan update proposal
  const dismissPendingPlanAction = useCallback(() => {
    setPendingPlanAction(null);
  }, []);

  // Generate workout plan (wrapped in useCallback)
  const generateWorkoutPlan = useCallback(async (preferences = {}) => {
    if (!profile) return;

    try {
      setIsLoading(true);
      const result = await aiCoach.generateWorkoutPlan(profile, preferences);
      
      if (result.success) {
        setWorkoutPlan(result.plan);
        return { success: true, plan: result.plan };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Clear conversation (wrapped in useCallback to maintain stable reference)
  const clearConversation = useCallback(() => {
    aiCoach.clearHistory();
    setConversationHistory([]);
    setPendingPlanAction(null);
  }, []);

  // Refresh daily motivation with optional progress data
  const refreshMotivation = useCallback((progressData = null) => {
    loadDailyMotivation(progressData);
  }, [loadDailyMotivation]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isLoading,
    dailyMotivation,
    conversationHistory,
    workoutPlan,
    pendingPlanAction,
    isApplyingPlanAction,
    sendMessage,
    generateWorkoutPlan,
    confirmPendingPlanAction,
    dismissPendingPlanAction,
    clearConversation,
    refreshMotivation,
    loadDailyMotivation // Export for direct use with progress data
  }), [
    isLoading,
    dailyMotivation,
    conversationHistory,
    workoutPlan,
    pendingPlanAction,
    isApplyingPlanAction,
    sendMessage,
    generateWorkoutPlan,
    confirmPendingPlanAction,
    dismissPendingPlanAction,
    clearConversation,
    refreshMotivation,
    loadDailyMotivation
  ]);

  return (
    <AICoachContext.Provider value={value}>
      {children}
    </AICoachContext.Provider>
  );
};
