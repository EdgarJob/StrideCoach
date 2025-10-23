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

      // Call the AI to generate the workout plan
      const aiResult = await aiCoach.generateWorkoutPlan(userProfile, preferences);
      
      if (aiResult.success) {
        console.log('✅ AI generated plan successfully');
        // Parse the AI response into structured plan format
        const plan = this.parsePlanResponse(aiResult.plan, userProfile, preferences);
        return {
          success: true,
          plan
        };
      } else {
        console.log('❌ AI failed to generate plan');
        // ✅ FIX: Return failure instead of generating fallback exercises
        // User requirement: Display ONLY AI model exercises
        return { 
          success: false, 
          error: aiResult.error || 'AI failed to generate workout plan. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Parse AI response into structured plan format
  parsePlanResponse(aiResponse, userProfile, preferences) {
    const planId = `plan_${Date.now()}`;
    const startDate = new Date();
    
    console.log('🤖 Parsing AI response:', aiResponse.substring(0, 200) + '...');
    
    // Try to parse the AI response
    let weeks;
    try {
      weeks = this.parseAIResponse(aiResponse, userProfile, preferences);
      
      // ✅ FIX: Check if parsing returned empty weeks (parsing failed)
      if (!weeks || weeks.length === 0) {
        console.log('❌ Parsing returned no weeks - AI response format issue');
        throw new Error('Failed to parse AI response: No workout weeks found');
      }
      
      console.log('✅ Successfully parsed AI response with', weeks.length, 'weeks');
    } catch (error) {
      console.log('❌ Failed to parse AI response:', error.message);
      // ✅ FIX: Don't generate fallback structure, throw error instead
      // User requirement: Display ONLY AI model exercises
      throw error;
    }
    
    // Create a structured 4-week plan
    const plan = {
      id: planId,
      user_id: userProfile.user_id,
      title: `${userProfile.fitness_level || 'Intermediate'} 4-Week Fitness Plan`,
      description: `Personalized 4-week fitness plan for ${userProfile.display_name}`,
      created_at: startDate.toISOString(),
      start_date: startDate.toISOString(),
      end_date: new Date(startDate.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(), // 4 weeks
      status: 'active',
      preferences: preferences,
      weeks: weeks
    };

    return plan;
  }
  
  // Parse AI response into structured weeks
  parseAIResponse(aiResponse, userProfile, preferences) {
    const weeks = [];
    
    console.log('🔍 Starting to parse AI response...');
    console.log('📄 AI Response length:', aiResponse.length);
    console.log('📄 First 500 chars:', aiResponse.substring(0, 500));
    
    // Improved regex to match the actual AI format:
    // ### Week X
    // **Monday**
    // - content
    // We need to capture from ### Week X until the next ### Week or end of string
    const weekPattern = /### Week (\d+)\s*([\s\S]*?)(?=### Week \d+|$)/g;
    const weekMatches = [...aiResponse.matchAll(weekPattern)];
    
    console.log(`🔍 Week pattern matches found: ${weekMatches.length}`);
    
    if (weekMatches.length > 0) {
      console.log(`📅 Found ${weekMatches.length} week sections in AI response`);
      
      weekMatches.forEach((match, index) => {
        const weekNumber = parseInt(match[1]);
        const weekText = match[2]; // The content after "### Week X"
        
        console.log(`📝 Parsing Week ${weekNumber}...`);
        console.log(`📝 Week ${weekNumber} text length: ${weekText.length}`);
        console.log(`📝 Week ${weekNumber} first 200 chars:`, weekText.substring(0, 200));
        
        weeks.push({
          week_number: weekNumber,
          focus: this.extractWeekFocus(weekText) || this.getWeekFocus(weekNumber),
          days: this.extractDaysFromWeek(weekText, preferences)
        });
      });
    } else {
      console.log('⚠️ No week sections found with improved regex, trying alternative approach...');
      
      // Try to find any "Week X" pattern (even without ###)
      const alternativePattern = /Week (\d+)[:\s]*([\s\S]*?)(?=Week \d+|$)/gi;
      const altMatches = [...aiResponse.matchAll(alternativePattern)];
      
      console.log(`🔍 Alternative pattern matches: ${altMatches.length}`);
      
      if (altMatches.length > 0) {
        console.log(`📅 Found ${altMatches.length} week sections using alternative pattern`);
        
        altMatches.forEach((match) => {
          const weekNumber = parseInt(match[1]);
          const weekText = match[2];
          
          console.log(`📝 Parsing Week ${weekNumber} (alt)...`);
          
          weeks.push({
            week_number: weekNumber,
            focus: this.extractWeekFocus(weekText) || this.getWeekFocus(weekNumber),
            days: this.extractDaysFromWeek(weekText, preferences)
          });
        });
      } else {
        console.log('❌ No week sections found in AI response - parsing failed');
        // ✅ FIX: Don't create fallback weeks with generated exercises
        // Return empty array to signal parsing failure
        // User requirement: Display ONLY AI model exercises
        return [];
      }
    }
    
    return weeks;
  }
  
  // Extract week focus from week text
  extractWeekFocus(weekText) {
    // Look for focus after "Week X:" or in the first line
    const focusMatch = weekText.match(/Week \d+[:\s]+([^\n]+)/i);
    if (focusMatch) {
      return focusMatch[1].trim();
    }
    return null;
  }
  
  // Extract days from a week's text
  extractDaysFromWeek(weekText, preferences) {
    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Extract selected days from preferences
    const availableDays = preferences.availableDays || {};
    const selectedDays = Object.entries(availableDays)
      .filter(([day, selected]) => selected)
      .map(([day]) => day.toLowerCase());
    
    // ✅ FIX: Only create day entries for SELECTED workout days
    // This prevents showing all 7 days with "Rest Day" placeholders
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayName = dayNames[dayIndex];
      const dayLower = dayName.toLowerCase();
      const isWorkoutDay = selectedDays.includes(dayLower);
      
      // Only add this day if it's a selected workout day
      if (isWorkoutDay) {
        const workout = this.extractWorkoutForDay(weekText, dayName, preferences);
        
        days.push({
          day_number: dayIndex + 1,
          day_name: dayName,
          is_workout_day: true,
          is_rest_day: false,
          workout: workout
        });
      }
    }
    
    return days;
  }
  
  // Extract workout details for a specific day
  extractWorkoutForDay(weekText, dayName, preferences) {
    console.log(`🔍 Looking for ${dayName} in week text...`);
    
    // Try multiple patterns to find the day workout:
    // Pattern 1: **Monday: Title**
    // Pattern 2: **Monday**\n- content
    // Pattern 3: Monday\n- content
    
    // First, try to find **DayName** followed by content until the next day or end
    const dayPattern1 = new RegExp(`\\*\\*${dayName}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\\*\\*|$)`, 'i');
    let dayMatch = weekText.match(dayPattern1);
    
    if (!dayMatch) {
      // Try without the bold markers
      const dayPattern2 = new RegExp(`${dayName}[:\\s]+([\\s\\S]*?)(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\\s]|$)`, 'i');
      dayMatch = weekText.match(dayPattern2);
    }
    
    if (dayMatch) {
      console.log(`✅ Found workout section for ${dayName}`);
      const workoutContent = dayMatch[1].trim();
      console.log(`📝 ${dayName} content length: ${workoutContent.length}`);
      console.log(`📝 ${dayName} first 150 chars:`, workoutContent.substring(0, 150));
      
      // Extract workout type from content
      let workoutType = 'Mixed';
      const contentLower = workoutContent.toLowerCase();
      if (contentLower.includes('walk') && contentLower.includes('strength')) {
        workoutType = 'Mixed';
      } else if (contentLower.includes('walk')) {
        workoutType = 'Walking';
      } else if (contentLower.includes('strength') || contentLower.includes('bodyweight')) {
        workoutType = 'Strength';
      } else if (contentLower.includes('cardio')) {
        workoutType = 'Cardio';
      } else if (contentLower.includes('run')) {
        workoutType = 'Running';
      } else if (contentLower.includes('yoga')) {
        workoutType = 'Yoga';
      } else if (contentLower.includes('cycle') || contentLower.includes('bike')) {
        workoutType = 'Cycling';
      }
      
      // Extract duration - look for patterns like "40 min", "(30 min)", "25 minutes"
      const durationMatch = workoutContent.match(/(\d+)\s*(?:min|minutes)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : (preferences.workoutDuration || 45);
      
      // Extract exercises from the content
      const exercises = this.extractExercisesFromText(workoutContent);
      console.log(`📋 Extracted ${exercises.length} exercises for ${dayName}`);
      
      // Determine difficulty
      let difficulty = preferences.difficultyLevel || 'Intermediate';
      if (contentLower.includes('intro') || contentLower.includes('beginner') || contentLower.includes('easy')) {
        difficulty = 'Beginner';
      } else if (contentLower.includes('challenge') || contentLower.includes('advanced') || contentLower.includes('hard')) {
        difficulty = 'Advanced';
      }
      
      // Create a notes/title from the first line or sentence
      const firstLine = workoutContent.split('\n')[0].trim();
      const notes = firstLine.replace(/^[-•*]\s*/, '').substring(0, 100);
      
      return {
        type: workoutType,
        duration_minutes: duration,
        exercises: exercises.length > 0 ? exercises : this.getDefaultExercises(workoutType),
        notes: notes || `${workoutType} Workout`,
        difficulty: difficulty
      };
    }
    
    console.log(`⚠️ No specific workout found for ${dayName}`);
    return null;
  }
  
  // Extract exercises from workout text
  extractExercisesFromText(workoutText) {
    const exercises = [];
    
    console.log('🔍 Extracting exercises from text...');
    console.log('📝 Text to parse:', workoutText.substring(0, 300));
    
    // Split by lines and process each line
    const lines = workoutText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines, section headers, and very short lines
      if (!trimmedLine || trimmedLine.length < 3) continue;
      if (trimmedLine.toLowerCase().includes('warm-up') && trimmedLine.includes(':')) continue;
      if (trimmedLine.toLowerCase().includes('cool-down') && trimmedLine.includes(':')) continue;
      if (trimmedLine.toLowerCase().includes('main') && trimmedLine.includes(':')) continue;
      if (trimmedLine.toLowerCase().includes('round') || trimmedLine.toLowerCase().includes('circuit')) continue;
      
      // Look for exercise patterns with bullet points
      const bulletMatch = trimmedLine.match(/^[-•*]\s*(.+)$/);
      if (bulletMatch) {
        const exerciseText = bulletMatch[1].trim();
        
        // Pattern: "Exercise name x reps"
        const repsMatch = exerciseText.match(/^(.+?)\s+x\s*(\d+)\s*(?:reps?|each\s+leg|each\s+side)?/i);
        if (repsMatch) {
          exercises.push({
            name: repsMatch[1].trim(),
            sets: 1,
            reps: parseInt(repsMatch[2]),
            duration_minutes: null,
            description: repsMatch[1].trim()
          });
          continue;
        }
        
        // Pattern: "Exercise name: duration min/sec"
        const durationMatch = exerciseText.match(/^(.+?):\s*(\d+)\s*(min|sec)/i);
        if (durationMatch) {
          const durationInMin = durationMatch[3].toLowerCase() === 'sec' 
            ? Math.ceil(parseInt(durationMatch[2]) / 60) 
            : parseInt(durationMatch[2]);
          exercises.push({
            name: durationMatch[1].trim(),
            sets: 1,
            reps: null,
            duration_minutes: durationInMin,
            description: durationMatch[1].trim()
          });
          continue;
        }
        
        // Pattern: "Exercise name (duration min)"
        const durationMatch2 = exerciseText.match(/^(.+?)\s*\((\d+)\s*min\)/i);
        if (durationMatch2) {
          exercises.push({
            name: durationMatch2[1].trim(),
            sets: 1,
            reps: null,
            duration_minutes: parseInt(durationMatch2[2]),
            description: durationMatch2[1].trim()
          });
          continue;
        }
        
        // Pattern: Just exercise name (no reps or duration specified)
        // Only add if it looks like an exercise (not a description or header)
        if (exerciseText.length >= 5 && !exerciseText.includes(':') && !exerciseText.toLowerCase().includes('week')) {
          exercises.push({
            name: exerciseText,
            sets: 1,
            reps: 10, // Default reps
            duration_minutes: null,
            description: exerciseText
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${exercises.length} exercises`);
    if (exercises.length > 0) {
      console.log('📋 First exercise:', exercises[0]);
    }
    
    return exercises;
  }
  
  // Get default exercises based on workout type
  getDefaultExercises(workoutType) {
    const defaults = {
      'Walking': [
        { name: 'Warm-up Walk', duration_minutes: 5, description: 'Easy pace' },
        { name: 'Brisk Walk', duration_minutes: 20, description: 'Moderate pace' },
        { name: 'Cool-down Walk', duration_minutes: 5, description: 'Slow pace' }
      ],
      'Strength': [
        { name: 'Squats', sets: 3, reps: 15, description: 'Bodyweight squats' },
        { name: 'Push-ups', sets: 3, reps: 10, description: 'Modified or full' },
        { name: 'Plank', sets: 3, duration_minutes: 1, description: 'Core stability' }
      ],
      'Mixed': [
        { name: 'Warm-up', duration_minutes: 5, description: 'Light cardio' },
        { name: 'Main Workout', duration_minutes: 30, description: 'Mixed exercises' },
        { name: 'Cool-down', duration_minutes: 5, description: 'Stretching' }
      ]
    };
    
    return defaults[workoutType] || defaults['Mixed'];
  }
  
  // Create week days with AI-inspired content
  createWeekDays(weekNumber, workoutDays, userProfile, preferences, aiResponse) {
    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayName = dayNames[dayIndex];
      const dayLower = dayName.toLowerCase();
      const isWorkoutDay = workoutDays.includes(dayLower);
      
      let workout = null;
      if (isWorkoutDay) {
        workout = this.createAIInspiredWorkout(weekNumber, dayName, userProfile, preferences, aiResponse);
      }
      
      days.push({
        day_number: dayIndex + 1,
        day_name: dayName,
        is_workout_day: isWorkoutDay,
        is_rest_day: !isWorkoutDay,
        workout: workout
      });
    }
    
    return days;
  }
  
  // Create AI-inspired workout based on the response
  createAIInspiredWorkout(weekNumber, dayName, userProfile, preferences, aiResponse) {
    // Extract workout type from AI response
    let workoutType = 'Cardio';
    if (aiResponse.toLowerCase().includes('running')) {
      workoutType = 'Running';
    } else if (aiResponse.toLowerCase().includes('strength')) {
      workoutType = 'Strength';
    } else if (aiResponse.toLowerCase().includes('yoga')) {
      workoutType = 'Recovery';
    }
    
    // Create progressive difficulty
    const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const difficulty = difficultyLevels[Math.min(weekNumber - 1, 3)];
    
    // Create AI-inspired exercises based on the response
    const exercises = this.createAIInspiredExercises(workoutType, weekNumber, dayName, aiResponse);
    
    return {
      type: workoutType,
      duration_minutes: preferences.workoutDuration || 60,
      exercises: exercises,
      notes: this.getWorkoutNotes(workoutType, weekNumber),
      difficulty: difficulty
    };
  }
  
  // Create AI-inspired exercises
  createAIInspiredExercises(workoutType, weekNumber, dayName, aiResponse) {
    const exercises = [];
    
    // Base exercises that can be enhanced with AI content
    const baseExercises = {
      'Running': [
        { name: 'Warm-up Walk', duration: 5, description: 'Easy pace to prepare your body' },
        { name: 'Main Run', duration: 30, description: 'Steady pace running' },
        { name: 'Cool-down Walk', duration: 5, description: 'Gradual cool down' }
      ],
      'Strength': [
        { name: 'Bodyweight Squats', sets: 3, reps: 15, description: 'Build leg strength' },
        { name: 'Push-ups', sets: 3, reps: 10, description: 'Upper body strength' },
        { name: 'Plank', sets: 3, duration: 30, description: 'Core stability' }
      ],
      'Cardio': [
        { name: 'Brisk Walking', duration: 20, description: 'Cardiovascular exercise' },
        { name: 'Jogging', duration: 15, description: 'Moderate intensity cardio' },
        { name: 'Stair Climbing', duration: 10, description: 'High intensity cardio' }
      ]
    };
    
    const baseWorkout = baseExercises[workoutType] || baseExercises['Cardio'];
    
    // Enhance with AI content if available
    baseWorkout.forEach((exercise, index) => {
      exercises.push({
        name: exercise.name,
        sets: exercise.sets || 1,
        reps: exercise.reps || null,
        duration_minutes: exercise.duration || 10,
        description: exercise.description
      });
    });
    
    return exercises;
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
