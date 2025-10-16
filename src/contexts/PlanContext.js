import React, { createContext, useContext, useState, useEffect } from 'react';
import { planService } from '../services/planService';
import { useAuth } from './AuthContext';

const PlanContext = createContext();

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load current plan when user changes
  useEffect(() => {
    if (user && profile) {
      loadCurrentPlan();
    } else {
      setCurrentPlan(null);
    }
  }, [user, profile]);

  // Load the user's current active plan
  const loadCurrentPlan = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await planService.getCurrentPlan(user.id);
      
      if (result.success) {
        setCurrentPlan(result.plan);
      } else {
        setCurrentPlan(null);
        // Don't set error for no plan found - this is normal for new users
        if (result.error && !result.error.includes('PGRST116')) {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new 4-week plan
  const generatePlan = async (preferences = {}) => {
    if (!profile) {
      setError('User profile not found');
      return { success: false, error: 'User profile not found' };
    }

    try {
      setIsLoading(true);
      setError(null);

      // Generate the plan using AI
      const result = await planService.generatePlan(profile, preferences);
      
      if (result.success) {
        // Save the plan to database
        const saveResult = await planService.savePlan(result.plan);
        
        if (saveResult.success) {
          setCurrentPlan(saveResult.plan);
          return { success: true, plan: saveResult.plan };
        } else {
          throw new Error(saveResult.error);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Complete a workout
  const completeWorkout = async (weekNumber, dayNumber, completionData) => {
    if (!currentPlan) {
      setError('No active plan found');
      return { success: false, error: 'No active plan found' };
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await planService.completeWorkout(
        currentPlan.id,
        weekNumber,
        dayNumber,
        completionData
      );

      if (result.success) {
        setCurrentPlan(result.plan);
        return { success: true, plan: result.plan };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's workout
  const getTodaysWorkout = () => {
    if (!currentPlan) return null;

    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    const dayNumber = (daysDiff % 7) + 1;

    if (weekNumber > 4) return null; // Plan completed

    const week = currentPlan.weeks[weekNumber - 1];
    if (!week) return null;

    const day = week.days[dayNumber - 1];
    if (!day || !day.is_workout_day) return null;

    return {
      weekNumber,
      dayNumber,
      workout: day.workout,
      weekFocus: week.focus,
      dayName: day.day_name
    };
  };

  // Get plan progress
  const getPlanProgress = () => {
    if (!currentPlan) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    currentPlan.weeks.forEach(week => {
      week.days.forEach(day => {
        if (day.is_workout_day) {
          total++;
          if (day.progress && day.progress.completed) {
            completed++;
          }
        }
      });
    });

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  // Get week progress
  const getWeekProgress = (weekNumber) => {
    if (!currentPlan || weekNumber < 1 || weekNumber > 4) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const week = currentPlan.weeks[weekNumber - 1];
    if (!week) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    week.days.forEach(day => {
      if (day.is_workout_day) {
        total++;
        if (day.progress && day.progress.completed) {
          completed++;
        }
      }
    });

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  // Check if plan is completed
  const isPlanCompleted = () => {
    const progress = getPlanProgress();
    return progress.percentage === 100;
  };

  // Get next workout
  const getNextWorkout = () => {
    if (!currentPlan) return null;

    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    const dayNumber = (daysDiff % 7) + 1;

    // Look for next workout starting from today
    for (let w = weekNumber - 1; w < 4; w++) {
      const week = currentPlan.weeks[w];
      if (!week) continue;

      const startDay = w === weekNumber - 1 ? dayNumber - 1 : 0;
      for (let d = startDay; d < 7; d++) {
        const day = week.days[d];
        if (day && day.is_workout_day && (!day.progress || !day.progress.completed)) {
          return {
            weekNumber: w + 1,
            dayNumber: d + 1,
            workout: day.workout,
            weekFocus: week.focus,
            dayName: day.day_name
          };
        }
      }
    }

    return null;
  };

  const value = {
    currentPlan,
    isLoading,
    error,
    generatePlan,
    completeWorkout,
    loadCurrentPlan,
    getTodaysWorkout,
    getPlanProgress,
    getWeekProgress,
    isPlanCompleted,
    getNextWorkout
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};
