import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiCoach } from '../services/aiService';
import { useAuth } from './AuthContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const [dailyMotivation, setDailyMotivation] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);

  // Load daily motivation on app start
  useEffect(() => {
    if (profile) {
      loadDailyMotivation();
    }
  }, [profile]);

  // Load daily motivation
  const loadDailyMotivation = async () => {
    if (!profile) return;
    
    try {
      setIsLoading(true);
      const result = await aiCoach.getDailyMotivation(profile);
      
      if (result.success) {
        setDailyMotivation(result.motivation);
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
  };

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

      // Get AI response
      const result = await aiCoach.chatWithCoach(message, profile);
      
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

  // Refresh daily motivation
  const refreshMotivation = () => {
    loadDailyMotivation();
  };

  const value = {
    isLoading,
    dailyMotivation,
    conversationHistory,
    workoutPlan,
    sendMessage,
    generateWorkoutPlan,
    clearConversation,
    refreshMotivation
  };

  return (
    <AICoachContext.Provider value={value}>
      {children}
    </AICoachContext.Provider>
  );
};
