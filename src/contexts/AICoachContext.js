import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { aiCoach } from '../services/aiService';
import { useAuth } from './AuthContext';
import { usePlan } from './PlanContext';

const AICoachContext = createContext();

export const useAICoach = () => {
  const context = useContext(AICoachContext);
  if (!context) {
    throw new Error('useAICoach must be used within an AICoachProvider');
  }
  return context;
};

export const AICoachProvider = ({ children }) => {
  const { user, profile } = useAuth();
  
  // Debug logging
  console.log('AICoachProvider rendering...');
  
  let currentPlan = null;
  try {
    const planContext = usePlan();
    currentPlan = planContext?.currentPlan || null;
    console.log('Plan context loaded successfully:', !!currentPlan);
  } catch (error) {
    console.error('Error accessing plan context:', error);
    // Fallback to null if plan context is not available
    currentPlan = null;
  }
  
  const [isLoading, setIsLoading] = useState(false);
  const [dailyMotivation, setDailyMotivation] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);

  // Load daily motivation with progress data (memoized to prevent re-renders)
  const loadDailyMotivation = useCallback(async (progressData = null) => {
    if (!profile) return;
    
    // ✅ FIX: Check if we already loaded motivation today
    const today = new Date().toDateString();
    const lastMotivationDate = localStorage.getItem('lastMotivationDate');
    
    if (lastMotivationDate === today && dailyMotivation) {
      console.log('📅 Daily motivation already loaded today, skipping...');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await aiCoach.getDailyMotivation(profile, progressData);
      
      if (result.success) {
        setDailyMotivation(result.motivation);
        // ✅ FIX: Store today's date to prevent multiple loads
        localStorage.setItem('lastMotivationDate', today);
        console.log('✅ Daily motivation loaded for', today);
      } else {
        console.error('Failed to load daily motivation:', result.error);
        setDailyMotivation("Ready to make today count? Every step brings you closer to your goals! 💪");
      }
    } catch (error) {
      console.error('Error loading daily motivation:', error);
      setDailyMotivation("Ready to make today count? Every step brings you closer to your goals! 💪");
    } finally {
      setIsLoading(false);
    }
  }, [profile, dailyMotivation]);

  // Send message to AI coach
  const sendMessage = async (message) => {
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
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.message,
          timestamp: new Date()
        };
        
        setConversationHistory(prev => [...prev, aiMessage]);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
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
  };

  // Generate workout plan
  const generateWorkoutPlan = async (preferences = {}) => {
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
      console.error('Error generating workout plan:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setConversationHistory([]);
    aiCoach.clearHistory();
  };

  // Refresh daily motivation with optional progress data
  const refreshMotivation = (progressData = null) => {
    loadDailyMotivation(progressData);
  };

  const value = {
    isLoading,
    dailyMotivation,
    conversationHistory,
    workoutPlan,
    sendMessage,
    generateWorkoutPlan,
    clearConversation,
    refreshMotivation,
    loadDailyMotivation // Export for direct use with progress data
  };

  return (
    <AICoachContext.Provider value={value}>
      {children}
    </AICoachContext.Provider>
  );
};
