import { supabase } from './supabase';
import { aiCoach } from './aiService';

export class PlanService {
  constructor() {
    this.currentPlan = null;
  }

  // Generate a 4-week workout plan using AI
  async generatePlan(userProfile, preferences = {}) {
    try {
      console.log('Generating 4-week plan for user:', userProfile);
      
      const planPrompt = `Create a comprehensive 4-week fitness plan for a user with the following profile:
      
      User Profile:
      - Age: ${userProfile.age}
      - Gender: ${userProfile.sex}
      - Height: ${userProfile.height_cm}cm
      - Weight: ${userProfile.weight_kg}kg
      - Fitness Level: ${userProfile.fitness_level || 'beginner'}
      - Goals: ${userProfile.goals || 'general fitness'}
      - Available Equipment: ${preferences.equipment || 'bodyweight only'}
      - Time per session: ${preferences.sessionDuration || '30-45 minutes'}
      - Days per week: ${preferences.daysPerWeek || '3-4 days'}
      
      Please create a structured 4-week plan with:
      1. Week-by-week progression
      2. Specific exercises for each day
      3. Sets, reps, and duration
      4. Rest days
      5. Progression guidelines
      6. Modifications for different fitness levels
      
      Format the response as a detailed JSON structure that can be stored in a database.`;

      const response = await aiCoach.chatWithCoach(planPrompt, userProfile);
      
      if (response.success) {
        // Parse the AI response and structure it as a plan
        const plan = this.parsePlanResponse(response.message, userProfile, preferences);
        return {
          success: true,
          plan: plan
        };
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      return {
        success: false,
        error: error.message
      };
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
    const daysPerWeek = preferences.daysPerWeek || 4;
    const sessionDuration = preferences.sessionDuration || 30;
    
    for (let week = 1; week <= 4; week++) {
      const weekData = {
        week_number: week,
        focus: this.getWeekFocus(week),
        days: this.generateWeekDays(week, daysPerWeek, sessionDuration, userProfile, preferences)
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
  generateWeekDays(week, daysPerWeek, sessionDuration, userProfile, preferences) {
    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Determine workout days based on preferences
    const workoutDays = this.getWorkoutDays(daysPerWeek);
    
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
    const workoutTypes = ['Cardio', 'Strength', 'Mixed', 'Recovery'];
    const workoutType = workoutTypes[dayIndex % workoutTypes.length];
    
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

  // Save plan to database
  async savePlan(plan) {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert([plan])
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
