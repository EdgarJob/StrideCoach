import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here';
console.log('🔑 API Key being used:', apiKey.substring(0, 10) + '...');

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Only for development - use server-side in production
});

// AI Coach Service
export class AICoachService {
  constructor() {
    this.conversationHistory = [];
    // Configure allowed models
    this.models = {
      plan: 'gpt-4.1-mini',      // For plan generation
      chat: 'gpt-4o-mini',       // For chat and motivation
      fallback: 'gpt-4o-mini'    // Fallback if specific model fails
    };
  }

  // Get model for specific function
  getModelForFunction(functionType) {
    const envModel = process.env.EXPO_PUBLIC_OPENAI_MODEL;
    if (envModel) {
      // Validate that environment model is in allowed list
      const allowedModels = Object.values(this.models);
      if (allowedModels.includes(envModel)) {
        console.log(`Using model from environment: ${envModel}`);
        return envModel;
      } else {
        console.warn(`Environment model ${envModel} not in allowed list. Using fallback.`);
      }
    }
    const model = this.models[functionType] || this.models.fallback;
    console.log(`Using ${functionType} model: ${model}`);
    return model;
  }

  // Get list of allowed models
  getAllowedModels() {
    return Object.values(this.models);
  }

  // Generate a personalized workout plan
  async generateWorkoutPlan(userProfile, preferences) {
    try {
      const prompt = this.buildWorkoutPlanPrompt(userProfile, preferences);
      const model = this.getModelForFunction('plan');
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are StrideCoach, an expert fitness AI coach specializing in walking and strength training. Create personalized, safe, and effective workout plans."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000, // Increased from 1500 to ensure full 4-week plan generation
        temperature: 0.7
      });

      return {
        success: true,
        plan: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating workout plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Chat with the AI coach
  async chatWithCoach(message, userProfile, currentPlan = null) {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: "user",
        content: message
      });

      const model = this.getModelForFunction('chat');
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: this.buildSystemPrompt(userProfile, currentPlan)
          },
          ...this.conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const aiResponse = response.choices[0].message.content;
      
      // Add AI response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse
      });

      return {
        success: true,
        message: aiResponse,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error chatting with AI coach:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get daily motivation and tips
  // Generate daily motivation based on actual progress data
  async getDailyMotivation(userProfile, progressData = {}) {
    try {
      // Ensure progressData is not null
      if (!progressData || typeof progressData !== 'object') {
        progressData = {};
      }
      
      // Extract progress metrics
      const completedWorkouts = progressData.completedWorkouts || 0;
      const totalWorkouts = progressData.totalWorkouts || 5;
      const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
      const streak = progressData.streak || 0;
      const weekNumber = progressData.weekNumber || 1;
      const lastWorkoutDate = progressData.lastWorkoutDate || 'Not yet';
      
      const prompt = `You are a direct, results-focused fitness coach analyzing this week's performance.

User: ${userProfile?.display_name || 'User'}
Goal: ${userProfile?.goal?.type || 'general fitness'}

ACTUAL PROGRESS DATA THIS WEEK:
- Workouts Completed: ${completedWorkouts} out of ${totalWorkouts} scheduled
- Completion Rate: ${completionRate}%
- Current Streak: ${streak} days
- Week: ${weekNumber} of 4
- Last Workout: ${lastWorkoutDate}

Provide a SHORT, NO-NONSENSE feedback message (2-3 sentences max, under 80 words) that:
1. States the facts about their performance (good or bad)
2. Gives specific, actionable feedback based on their completion rate:
   - If 80-100%: Acknowledge strong performance and push for consistency
   - If 50-79%: Point out the gap and motivate to close it
   - If below 50%: Be direct about underperformance and need for commitment
3. Include ONE specific action they should take this week

Be honest, direct, and motivating. No fluff or generic platitudes. Base everything on their actual numbers.`;

      const model = this.getModelForFunction('chat');
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are StrideCoach, a direct, data-driven fitness coach. Give honest, specific feedback based on actual performance metrics. No generic motivation - only fact-based analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7 // Lower temperature for more consistent, factual responses
      });

      return {
        success: true,
        motivation: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error getting daily motivation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Build system prompt for chat
  buildSystemPrompt(userProfile, currentPlan = null) {
    let planContext = '';
    let preferencesContext = '';
    
    // Get current date and time information
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (currentPlan) {
      // Extract plan information
      const planTitle = currentPlan.title || '4-Week Fitness Plan';
      const totalWeeks = currentPlan.weeks?.length || 0;
      const currentWeek = currentPlan.currentWeek || 1;
      
      // Extract workout types from plan
      const workoutTypes = this.extractWorkoutTypesFromPlan(currentPlan);
      const availableDays = this.extractAvailableDaysFromPlan(currentPlan);
      
      planContext = `
CURRENT ACTIVE PLAN:
- Plan: ${planTitle}
- Progress: Week ${currentWeek} of ${totalWeeks}
- Workout Types: ${workoutTypes}
- Available Days: ${availableDays}
- Plan Status: ${currentPlan.status || 'Active'}

You have access to the user's current workout plan and can reference specific workouts, progress, and upcoming sessions.`;
    } else {
      planContext = `
CURRENT PLAN STATUS: No active plan found. The user may be new or hasn't generated a plan yet.
You can help them understand how to create a personalized workout plan.`;
    }

    // Extract preferences from user profile if available
    if (userProfile?.workout_preferences) {
      const prefs = userProfile.workout_preferences;
      preferencesContext = `
USER PREFERENCES:
- Workout Duration: ${prefs.workoutDuration || 'Not specified'} minutes
- Difficulty Level: ${prefs.difficultyLevel || 'Not specified'}
- Primary Goal: ${prefs.primaryGoal || 'Not specified'}
- Preferred Time: ${prefs.preferredTime || 'Not specified'}
- Equipment Available: ${prefs.hasEquipment ? Object.entries(prefs.hasEquipment).filter(([_, available]) => available).map(([equipment, _]) => equipment).join(', ') : 'None'}`;
    }

    return `You are StrideCoach, an expert AI fitness coach specializing in walking and strength training. 

CURRENT DATE & TIME:
- Today is: ${currentDate}
- Current time: ${currentTime}
- Day of week: ${dayOfWeek}

USER PROFILE:
- Name: ${userProfile?.display_name || 'User'}
- Age: ${userProfile?.age || 'Not specified'}
- Height: ${userProfile?.height_cm || 'Not specified'} cm
- Weight: ${userProfile?.weight_kg || 'Not specified'} kg
- Goal: ${userProfile?.goal?.type || 'General fitness'}
- Target Weight: ${userProfile?.goal?.target_weight || 'Not specified'} kg
- Workout Schedule: ${userProfile?.schedule?.days?.join(', ') || 'Not specified'}
- Equipment: ${userProfile?.equipment?.join(', ') || 'None'}

${planContext}

${preferencesContext}

GUIDELINES:
- Be encouraging, supportive, and professional
- Reference their current plan and progress when relevant
- Focus on walking and strength training
- Provide safe, evidence-based advice
- Keep responses concise but helpful
- Ask clarifying questions when needed
- Never provide medical advice
- Encourage gradual progress and consistency
- If they ask about workouts, reference their current plan if available`;
  }

  // Extract workout types from current plan
  extractWorkoutTypesFromPlan(plan) {
    if (!plan?.weeks) return 'Not specified';
    
    const workoutTypes = new Set();
    plan.weeks.forEach(week => {
      if (week.days) {
        week.days.forEach(day => {
          if (day.workouts) {
            day.workouts.forEach(workout => {
              if (workout.type) {
                workoutTypes.add(workout.type);
              }
            });
          }
        });
      }
    });
    
    return Array.from(workoutTypes).join(', ') || 'Not specified';
  }

  // Extract available days from current plan
  extractAvailableDaysFromPlan(plan) {
    if (!plan?.weeks) return 'Not specified';
    
    const availableDays = new Set();
    plan.weeks.forEach(week => {
      if (week.days) {
        week.days.forEach(day => {
          if (day.dayName) {
            availableDays.add(day.dayName);
          }
        });
      }
    });
    
    return Array.from(availableDays).join(', ') || 'Not specified';
  }

  // Build workout plan prompt
  buildWorkoutPlanPrompt(userProfile, preferences) {
    // Extract selected workout types
    const selectedWorkoutTypes = Object.entries(preferences?.workoutTypes || {})
      .filter(([type, selected]) => selected)
      .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1))
      .join(', ');

    // Extract selected available days
    const selectedDays = Object.entries(preferences?.availableDays || {})
      .filter(([day, selected]) => selected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(', ');

    // Extract selected equipment
    const selectedEquipment = Object.entries(preferences?.hasEquipment || {})
      .filter(([equipment, selected]) => selected)
      .map(([equipment]) => equipment.replace(/_/g, ' ').charAt(0).toUpperCase() + equipment.replace(/_/g, ' ').slice(1))
      .join(', ');

    // Get workout duration from preferences
    const workoutDuration = preferences?.workoutDuration ? `${preferences.workoutDuration} minutes` : '30-45 minutes';
    
    // Get difficulty level from preferences
    const difficultyLevel = preferences?.difficultyLevel ? 
      preferences.difficultyLevel.charAt(0).toUpperCase() + preferences.difficultyLevel.slice(1) : 
      'Moderate';

    // Get primary goal from preferences
    const primaryGoal = preferences?.primaryGoal ? 
      preferences.primaryGoal.replace(/_/g, ' ').charAt(0).toUpperCase() + preferences.primaryGoal.replace(/_/g, ' ').slice(1) : 
      'General fitness';

    // Get preferred time from preferences
    const preferredTime = preferences?.preferredTime ? 
      preferences.preferredTime.charAt(0).toUpperCase() + preferences.preferredTime.slice(1) : 
      'Not specified';

    // ✅ Build dynamic example format based on actual selected days
    const selectedDaysArray = Object.entries(preferences?.availableDays || {})
      .filter(([day, selected]) => selected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
    
    // ✅ UPDATED: Provide flexible formatting guidelines instead of rigid templates
    // This allows the AI to design different workout types (intervals, steady runs, tempo, etc.)
    const formatGuidelines = `
WORKOUT STRUCTURE GUIDELINES (use appropriate format for each workout type):

For Running/Walking workouts:
- Always include: Warm-Up → Main Workout → Cool Down
- Use DISTANCE (km) + PACE (min/km) format: "3km at 6:00/km" or "2km at a conversational pace"
- For interval workouts: Group repeats clearly (e.g., "Repeat x4:" or "4 Rounds:")
- For steady runs: Simply state distance and pace (e.g., "5km steady run at 5:50/km")
- For long runs: State total distance and effort level (e.g., "8km at easy pace")
- Use seconds for rest periods: "90s rest" or "2 minutes rest"

For Strength workouts:
- Always include: Warm-Up → Main Workout → Cool Down
- Use reps and sets format: "Squats x 15" or "Push-ups x 10"
- Group exercises into rounds/circuits if appropriate: "3 Rounds:" or "Circuit (x4):"
- Use time for holds: "Plank: 45 seconds"
- Include rest periods: "Rest: 90 seconds between rounds"

IMPORTANT: Choose the workout type that best fits the training goal for each day. Don't force all workouts into the same structure.`;


    return `Create a 4-week personalized workout plan for:

User Details:
- Name: ${userProfile?.display_name || 'New User'}
- Age: ${userProfile?.age || 25}
- Height: ${userProfile?.height_cm || 175} cm
- Weight: ${userProfile?.weight_kg || 70} kg
- Goal: ${primaryGoal}
- Target Weight: ${userProfile?.goal_weight_kg || 65} kg
- Available Days: ${selectedDays || 'Monday, Wednesday, Friday'}
- Preferred Time: ${preferredTime}
- Equipment: ${selectedEquipment || 'None'}

Preferences:
- Workout Duration: ${workoutDuration}
- Intensity Level: ${difficultyLevel}
- Focus Areas: ${primaryGoal}
- Workout Types: ${selectedWorkoutTypes || 'Walking, Strength Training'}

CRITICAL REQUIREMENTS: 
1. You MUST create workouts for EXACTLY these days ONLY: ${selectedDays || 'Monday, Wednesday, Friday'}
2. DO NOT include workouts for any other days
3. Each workout should be approximately ${workoutDuration}
4. Focus on these workout types: ${selectedWorkoutTypes || 'Walking, Strength Training'}
5. Difficulty should match: ${difficultyLevel}
6. Design VARIED workout types across the week (e.g., intervals, steady runs, tempo runs, long runs, etc.)
7. Don't force all workouts into the same structure - vary them based on training principles

${formatGuidelines}

Please create a structured 4-week progressive plan with the following format:

## Daily Workout Breakdown

### Week 1

${selectedDaysArray.map(day => `**${day}**\n- Warm-Up:\n  [Design appropriate warm-up]\n- Main Workout:\n  [Design workout based on day's focus - vary between intervals, steady runs, tempo, etc.]\n- Cool Down:\n  [Design appropriate cool down]`).join('\n\n')}

### Week 2

[Create ${selectedDaysArray.length} varied workouts for: ${selectedDays}]
[Progress intensity from Week 1]

### Week 3

[Create ${selectedDaysArray.length} varied workouts for: ${selectedDays}]
[Continue progressive overload]

### Week 4

[Create ${selectedDaysArray.length} varied workouts for: ${selectedDays}]
[Peak week or recovery week based on goal]

TRAINING VARIETY PRINCIPLES:
- Mix workout types: intervals, steady state, tempo, long runs, recovery runs
- Don't repeat the same workout structure every session
- Balance hard and easy days appropriately
- Progress difficulty across the 4 weeks
- Ensure proper recovery between intense sessions`;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }
}

// Export a singleton instance
export const aiCoach = new AICoachService();