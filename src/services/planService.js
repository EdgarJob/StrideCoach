import { supabase } from './supabase';
import { aiCoach } from './aiService';

export class PlanService {
  constructor() {
    this.currentPlan = null;
  }

  // Generate a 4-week workout plan using preferences (AI optional)
  async generatePlan(userProfile, preferences = {}) {
    try {
      console.log('Generating 4-week plan for user:', userProfile);

      // Build the plan locally to guarantee preferences are enforced
      const plan = this.parsePlanResponse('', userProfile, preferences);

      // Optionally, you could call the AI plan generator here to enrich details
      // const aiResult = await aiCoach.generateWorkoutPlan(userProfile, preferences);
      // You can merge AI suggestions into the local structure if desired.

      return {
        success: true,
        plan
      };
    } catch (error) {
      console.error('Error generating plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Parse AI response into structured plan format
  parsePlanResponse(aiResponse, userProfile, preferences) {
    const planId = `plan_${Date.now()}`;
    const startDate = new Date();
    
    // Create a structured 4-week plan
    const plan = {
      id: planId,
      user_id: userProfile.user_id,
      title: `${userProfile.fitness_level || 'Beginner'} 4-Week Fitness Plan`,
      description: `Personalized 4-week fitness plan for ${userProfile.display_name}`,
      created_at: startDate.toISOString(),
      start_date: startDate.toISOString(),
      end_date: new Date(startDate.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(), // 4 weeks
      status: 'active',
      preferences: preferences,
      weeks: this.generateWeeklyStructure(userProfile, preferences)
    };

    return plan;
  }

  // Generate the weekly structure for the plan
  generateWeeklyStructure(userProfile, preferences) {
    const weeks = [];
    // Derive from preferences
    const availableDays = preferences.availableDays || {};
    const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const selectedDayIndexes = dayOrder
      .map((d, idx) => (availableDays[d] ? idx : -1))
      .filter(idx => idx >= 0);

    const daysPerWeek = selectedDayIndexes.length > 0 ? selectedDayIndexes.length : 3;
    const sessionDuration = preferences.workoutDuration || 30;
    
    for (let week = 1; week <= 4; week++) {
      const weekData = {
        week_number: week,
        focus: this.getWeekFocus(week),
        days: this.generateWeekDays(
          week,
          daysPerWeek,
          sessionDuration,
          userProfile,
          preferences,
          selectedDayIndexes
        )
      };
      weeks.push(weekData);
    }
    
    return weeks;
  }

  // Get the focus for each week
  getWeekFocus(week) {
    const focuses = {
      1: 'Foundation Building',
      2: 'Progressive Overload',
      3: 'Intensity Increase',
      4: 'Peak Performance'
    };
    return focuses[week] || 'General Fitness';
  }

  // Generate workout days for a week
  generateWeekDays(week, daysPerWeek, sessionDuration, userProfile, preferences, selectedDayIndexes) {
    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Determine workout days based on explicit user selection where possible
    const workoutDays = (selectedDayIndexes && selectedDayIndexes.length > 0)
      ? selectedDayIndexes
      : this.getWorkoutDays(daysPerWeek);
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const isWorkoutDay = workoutDays.includes(dayIndex);
      
      const dayData = {
        day_number: dayIndex + 1,
        day_name: dayNames[dayIndex],
        is_workout_day: isWorkoutDay,
        is_rest_day: !isWorkoutDay,
        workout: isWorkoutDay ? this.generateWorkout(week, dayIndex, sessionDuration, userProfile, preferences) : null
      };
      
      days.push(dayData);
    }
    
    return days;
  }

  // Determine which days are workout days
  getWorkoutDays(daysPerWeek) {
    const patterns = {
      3: [0, 2, 4], // Mon, Wed, Fri
      4: [0, 1, 3, 5], // Mon, Tue, Thu, Sat
      5: [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
      6: [0, 1, 2, 3, 4, 5] // Mon-Sat
    };
    return patterns[daysPerWeek] || patterns[3];
  }

  // Generate a specific workout for a day
  generateWorkout(week, dayIndex, sessionDuration, userProfile, preferences) {
    // Choose workout type based on user preferences, cycle through selected types
    const prefTypes = preferences.workoutTypes || {};
    const preferredList = Object.keys(prefTypes).filter(k => prefTypes[k]);

    // Map preference keys to displayed types
    const mapType = (t) => {
      switch (t) {
        case 'walking': return 'Cardio';
        case 'running': return 'Cardio';
        case 'strength': return 'Strength';
        case 'yoga': return 'Recovery';
        case 'cycling': return 'Cardio';
        case 'swimming': return 'Cardio';
        default: return 'Mixed';
      }
    };

    const typesCycle = preferredList.length > 0 ? preferredList.map(mapType) : ['Cardio','Strength','Mixed','Recovery'];
    const workoutType = typesCycle[dayIndex % typesCycle.length];
    
    return {
      type: workoutType,
      duration_minutes: sessionDuration,
      exercises: this.generateExercises(workoutType, week, userProfile, preferences),
      notes: this.getWorkoutNotes(workoutType, week),
      difficulty: this.getWorkoutDifficulty(week)
    };
  }

  // Generate exercises for a workout
  generateExercises(workoutType, week, userProfile, preferences) {
    const exerciseLibrary = this.getExerciseLibrary();
    const exercises = [];
    
    if (workoutType === 'Cardio') {
      exercises.push(...this.getCardioExercises(week, userProfile));
    } else if (workoutType === 'Strength') {
      exercises.push(...this.getStrengthExercises(week, userProfile, preferences));
    } else if (workoutType === 'Mixed') {
      exercises.push(...this.getMixedExercises(week, userProfile, preferences));
    } else if (workoutType === 'Recovery') {
      exercises.push(...this.getRecoveryExercises(week, userProfile));
    }
    
    return exercises;
  }

  // Get cardio exercises
  getCardioExercises(week, userProfile) {
    const baseExercises = [
      { name: 'Brisk Walking', duration: 20, intensity: 'moderate' },
      { name: 'Jogging', duration: 15, intensity: 'moderate' },
      { name: 'Stair Climbing', duration: 10, intensity: 'moderate' }
    ];
    
    // Increase intensity based on week
    const intensityMultiplier = 1 + (week - 1) * 0.2;
    
    return baseExercises.map(exercise => ({
      ...exercise,
      duration: Math.round(exercise.duration * intensityMultiplier),
      sets: 1,
      reps: null
    }));
  }

  // Get strength exercises
  getStrengthExercises(week, userProfile, preferences) {
    const baseExercises = [
      { name: 'Push-ups', sets: 3, reps: 10, rest: 60 },
      { name: 'Squats', sets: 3, reps: 15, rest: 60 },
      { name: 'Lunges', sets: 3, reps: 12, rest: 60 },
      { name: 'Plank', sets: 3, reps: 30, rest: 60 },
      { name: 'Mountain Climbers', sets: 3, reps: 20, rest: 60 }
    ];
    
    // Increase reps/sets based on week
    const progressionMultiplier = 1 + (week - 1) * 0.15;
    
    return baseExercises.map(exercise => ({
      ...exercise,
      reps: Math.round(exercise.reps * progressionMultiplier),
      sets: week >= 3 ? exercise.sets + 1 : exercise.sets
    }));
  }

  // Get mixed exercises
  getMixedExercises(week, userProfile, preferences) {
    return [
      ...this.getCardioExercises(week, userProfile).slice(0, 2),
      ...this.getStrengthExercises(week, userProfile, preferences).slice(0, 3)
    ];
  }

  // Get recovery exercises
  getRecoveryExercises(week, userProfile) {
    return [
      { name: 'Light Walking', duration: 15, intensity: 'low', sets: 1, reps: null },
      { name: 'Stretching', duration: 20, intensity: 'low', sets: 1, reps: null },
      { name: 'Yoga Flow', duration: 15, intensity: 'low', sets: 1, reps: null }
    ];
  }

  // Get exercise library
  getExerciseLibrary() {
    return {
      cardio: ['Walking', 'Jogging', 'Running', 'Cycling', 'Swimming', 'Stair Climbing'],
      strength: ['Push-ups', 'Squats', 'Lunges', 'Plank', 'Mountain Climbers', 'Burpees'],
      flexibility: ['Stretching', 'Yoga', 'Pilates', 'Dynamic Warm-up']
    };
  }

  // Get workout notes
  getWorkoutNotes(workoutType, week) {
    const notes = {
      Cardio: `Focus on maintaining steady pace. Week ${week} intensity.`,
      Strength: `Focus on proper form. Increase weight/reps as comfortable.`,
      Mixed: `Balance cardio and strength. Listen to your body.`,
      Recovery: `Light activity to promote recovery. Stay hydrated.`
    };
    return notes[workoutType] || 'Focus on proper form and breathing.';
  }

  // Get workout difficulty
  getWorkoutDifficulty(week) {
    const difficulties = ['Beginner', 'Beginner', 'Intermediate', 'Intermediate'];
    return difficulties[week - 1] || 'Beginner';
  }

  // Get equipment list from preferences
  getEquipmentList(equipmentPrefs) {
    if (!equipmentPrefs || typeof equipmentPrefs !== 'object') {
      return 'bodyweight only';
    }

    const equipmentList = [];
    if (equipmentPrefs.none) equipmentList.push('bodyweight');
    if (equipmentPrefs.dumbbells) equipmentList.push('dumbbells');
    if (equipmentPrefs.resistance_bands) equipmentList.push('resistance bands');
    if (equipmentPrefs.yoga_mat) equipmentList.push('yoga mat');
    if (equipmentPrefs.treadmill) equipmentList.push('treadmill');
    if (equipmentPrefs.bike) equipmentList.push('stationary bike');

    return equipmentList.length > 0 ? equipmentList.join(', ') : 'bodyweight only';
  }

  // Save plan to database
  async savePlan(plan) {
    try {
      // Sanitize the plan data to avoid circular references
      const sanitizedPlan = this.sanitizePlanData(plan);
      
      // Transform the plan to match database schema
      const planData = {
        user_id: sanitizedPlan.user_id,
        title: sanitizedPlan.title,
        description: sanitizedPlan.description,
        start_date: sanitizedPlan.start_date,
        end_date: sanitizedPlan.end_date,
        status: sanitizedPlan.status,
        preferences: sanitizedPlan.preferences,
        weeks: sanitizedPlan.weeks
      };

      const { data, error } = await supabase
        .from('workout_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      this.currentPlan = data;
      return {
        success: true,
        plan: data
      };
    } catch (error) {
      console.error('Error saving plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sanitize plan data to remove circular references
  sanitizePlanData(plan) {
    try {
      // Create a clean copy of the plan data
      const sanitized = {
        user_id: plan.user_id,
        title: plan.title || 'My Workout Plan',
        description: plan.description || 'A personalized fitness plan',
        start_date: plan.start_date || new Date().toISOString(),
        end_date: plan.end_date || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: plan.status || 'active',
        preferences: this.sanitizePreferences(plan.preferences || {}),
        weeks: this.sanitizeWeeks(plan.weeks || [])
      };
      
      return sanitized;
    } catch (error) {
      console.error('Error sanitizing plan data:', error);
      // Return a minimal safe structure
      return {
        user_id: plan.user_id,
        title: 'My Workout Plan',
        description: 'A personalized fitness plan',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        preferences: {},
        weeks: []
      };
    }
  }

  // Sanitize preferences object
  sanitizePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      return {};
    }

    const sanitized = {};
    
    // Safely copy known preference properties
    const allowedKeys = [
      'workoutTypes', 'availableDays', 'workoutDuration', 'difficultyLevel',
      'primaryGoal', 'hasEquipment', 'preferredTime', 'experienceLevel',
      'fitnessGoals', 'limitations', 'customNotes'
    ];

    for (const key of allowedKeys) {
      if (preferences.hasOwnProperty(key)) {
        try {
          // Test if the value can be JSON stringified
          JSON.stringify(preferences[key]);
          sanitized[key] = preferences[key];
        } catch (error) {
          console.warn(`Skipping circular reference in preferences.${key}`);
          sanitized[key] = null;
        }
      }
    }

    return sanitized;
  }

  // Sanitize weeks array
  sanitizeWeeks(weeks) {
    if (!Array.isArray(weeks)) {
      return [];
    }

    return weeks.map(week => {
      try {
        // Test if the week can be JSON stringified
        JSON.stringify(week);
        return week;
      } catch (error) {
        console.warn('Skipping circular reference in week data');
        return {
          weekNumber: week.weekNumber || 1,
          focus: week.focus || 'General Fitness',
          days: []
        };
      }
    });
  }

  // Get user's current plan
  async getCurrentPlan(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      this.currentPlan = data;
      return {
        success: true,
        plan: data
      };
    } catch (error) {
      console.error('Error getting current plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update plan progress
  async updatePlanProgress(planId, weekNumber, dayNumber, progress) {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({
          updated_at: new Date().toISOString(),
          [`weeks.${weekNumber - 1}.days.${dayNumber - 1}.progress`]: progress
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        plan: data
      };
    } catch (error) {
      console.error('Error updating plan progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Complete a workout
  async completeWorkout(planId, weekNumber, dayNumber, completionData) {
    try {
      const progress = {
        completed: true,
        completed_at: new Date().toISOString(),
        duration_minutes: completionData.duration || 0,
        notes: completionData.notes || '',
        difficulty_rating: completionData.difficulty || 3,
        exercises_completed: completionData.exercises || []
      };

      return await this.updatePlanProgress(planId, weekNumber, dayNumber, progress);
    } catch (error) {
      console.error('Error completing workout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const planService = new PlanService();
