import React, { createContext, useContext, useState, useEffect } from 'react';
import { planService } from '../services/planService';
import { useAuth } from './AuthContext';
import cacheService from '../services/cacheService';

const PlanContext = createContext();

const DEFAULT_PLAN_PREFERENCES = {
  workoutTypes: {
    walking: true,
    strength: true,
    running: false,
    yoga: false,
    cycling: false,
    swimming: false
  },
  availableDays: {
    monday: true,
    tuesday: false,
    wednesday: true,
    thursday: false,
    friday: true,
    saturday: false,
    sunday: false
  },
  workoutDuration: 30,
  difficultyLevel: 'beginner',
  primaryGoal: 'general_fitness',
  preferredTime: 'not_specified',
  hasEquipment: {
    none: true,
    dumbbells: false,
    resistance_bands: false,
    yoga_mat: false,
    treadmill: false,
    bike: false
  }
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_FALLBACK_DAYS = ['monday', 'wednesday', 'friday'];

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const deepMergeObjects = (base, updates) => {
  if (!isPlainObject(base)) return isPlainObject(updates) ? { ...updates } : {};
  if (!isPlainObject(updates)) return { ...base };

  const merged = { ...base };
  Object.entries(updates).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      merged[key] = deepMergeObjects(base[key], value);
      return;
    }

    merged[key] = value;
  });

  return merged;
};

const normalizeAvailableDays = (days) => {
  const normalized = {};
  DAY_KEYS.forEach((dayKey) => {
    normalized[dayKey] = Boolean(days?.[dayKey]);
  });
  return normalized;
};

const countSelectedDays = (days) => DAY_KEYS.reduce((count, dayKey) => (
  days?.[dayKey] ? count + 1 : count
), 0);

const getSelectedDays = (days) => DAY_KEYS.filter((dayKey) => Boolean(days?.[dayKey]));

const isExplicitLowFrequencyRequest = (requestText = '') => {
  const normalized = requestText.toLowerCase();
  if (!normalized.trim()) return false;

  const explicitPatterns = [
    /\bonly\s+\d+\s+(day|days|workout|workouts)\b/,
    /\b(just|only)\s+(two|three|2|3)\s+(day|days|workout|workouts)\b/,
    /\b\d+\s+(day|days|workout|workouts)\s+(a|per)\s+week\b/,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+and\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+only\b/
  ];

  return explicitPatterns.some((pattern) => pattern.test(normalized));
};

const applyAvailableDaySafety = (currentAvailableDays, proposedAvailableDays, requestText = '', hasCurrentPlan = false) => {
  const currentDays = normalizeAvailableDays(currentAvailableDays);
  const safeDays = normalizeAvailableDays(proposedAvailableDays);
  const currentCount = countSelectedDays(currentDays);
  const proposedCount = countSelectedDays(safeDays);
  const explicitLowFrequency = isExplicitLowFrequencyRequest(requestText);

  if (explicitLowFrequency) {
    return {
      adjusted: false,
      availableDays: safeDays,
      currentCount,
      proposedCount,
      finalCount: proposedCount,
      reason: null
    };
  }

  const minimumDays = hasCurrentPlan
    ? Math.max(3, currentCount - 2)
    : 3;

  if (proposedCount >= minimumDays) {
    return {
      adjusted: false,
      availableDays: safeDays,
      currentCount,
      proposedCount,
      finalCount: proposedCount,
      reason: null
    };
  }

  const candidates = [
    ...getSelectedDays(currentDays),
    ...DEFAULT_FALLBACK_DAYS,
    ...DAY_KEYS
  ];

  let finalCount = proposedCount;
  candidates.forEach((dayKey) => {
    if (finalCount >= minimumDays) return;
    if (!safeDays[dayKey]) {
      safeDays[dayKey] = true;
      finalCount += 1;
    }
  });

  return {
    adjusted: true,
    availableDays: safeDays,
    currentCount,
    proposedCount,
    finalCount,
    reason: `Prevented an aggressive day reduction (${proposedCount} -> ${finalCount}) without explicit low-frequency request.`
  };
};

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
  const [isFromCache, setIsFromCache] = useState(false); // Track if data is from cache

  // Load current plan when user changes
  useEffect(() => {
    if (user && profile) {
      loadCurrentPlan();
    } else {
      setCurrentPlan(null);
    }
  }, [user, profile]);

  // Load the user's current active plan with cache-first strategy
  const loadCurrentPlan = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (forceRefresh) {
        await cacheService.invalidateWorkoutPlan();
      }
      
      // Try cache-first strategy
      const cacheResult = await cacheService.cacheFirst(
        'workout_plan',
        async () => {
          const result = await planService.getCurrentPlan(user.id);
          if (result.success) {
            return result.plan;
          } else {
            // Don't cache errors, return null for no plan
            return null;
          }
        }
      );
      
      setCurrentPlan(cacheResult.data);
      setIsFromCache(cacheResult.fromCache);

    } catch (error) {
      setError(error.message);
      
      const cachedPlan = await cacheService.getWorkoutPlan();
      if (cachedPlan) {
        setCurrentPlan(cachedPlan);
        setIsFromCache(true);
      }
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

      // Invalidate old cached plan
      await cacheService.invalidateWorkoutPlan();

      // Generate the plan using AI
      const result = await planService.generatePlan(profile, preferences);
      
      if (result.success) {
        // Save the plan to database
        const saveResult = await planService.savePlan(result.plan);
        
        if (saveResult.success) {
          setCurrentPlan(saveResult.plan);
          setIsFromCache(false);
          
          await cacheService.cacheWorkoutPlan(saveResult.plan);

          // No longer persisting plan preferences to profile; preferences are managed in Plans only
          return { success: true, plan: saveResult.plan };
        } else {
          throw new Error(saveResult.error);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Apply AI coach plan modifications after user confirmation
  const applyCoachPlanUpdate = async (preferenceUpdates = {}, coachSummary = '', options = {}) => {
    if (!profile) {
      setError('User profile not found');
      return { success: false, error: 'User profile not found' };
    }

    try {
      setIsLoading(true);
      setError(null);

      await cacheService.invalidateWorkoutPlan();

      const basePreferences = deepMergeObjects(
        DEFAULT_PLAN_PREFERENCES,
        isPlainObject(currentPlan?.preferences) ? currentPlan.preferences : {}
      );
      const mergedPreferences = deepMergeObjects(basePreferences, preferenceUpdates);
      const daySafety = applyAvailableDaySafety(
        basePreferences.availableDays,
        mergedPreferences.availableDays,
        options.userRequestText || '',
        Boolean(currentPlan?.id)
      );
      mergedPreferences.availableDays = daySafety.availableDays;

      const generatedResult = await planService.generatePlan(profile, mergedPreferences);
      if (!generatedResult.success) {
        throw new Error(generatedResult.error);
      }

      let persistedResult;
      if (currentPlan?.id) {
        persistedResult = await planService.updatePlan(currentPlan.id, {
          title: generatedResult.plan.title,
          description: generatedResult.plan.description,
          start_date: generatedResult.plan.start_date,
          end_date: generatedResult.plan.end_date,
          status: 'active',
          preferences: mergedPreferences,
          weeks: generatedResult.plan.weeks
        });
      } else {
        persistedResult = await planService.savePlan({
          ...generatedResult.plan,
          preferences: mergedPreferences,
          status: 'active'
        });
      }

      if (!persistedResult.success) {
        throw new Error(persistedResult.error);
      }

      setCurrentPlan(persistedResult.plan);
      setIsFromCache(false);
      await cacheService.cacheWorkoutPlan(persistedResult.plan);

      return {
        success: true,
        plan: persistedResult.plan,
        preferences: mergedPreferences,
        summary: coachSummary,
        daySafety
      };
    } catch (error) {
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
        setIsFromCache(false);

        await cacheService.cacheWorkoutPlan(result.plan);

        return { success: true, plan: result.plan };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
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
    isFromCache,
    generatePlan,
    applyCoachPlanUpdate,
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
