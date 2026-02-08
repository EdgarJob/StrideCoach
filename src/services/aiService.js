import { supabase } from './supabase';

// AI Coach Service - Now calls secure Supabase Edge Functions
export class AICoachService {
  constructor() {
    this.conversationHistory = [];
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  }

  // Generic method to call Edge Functions with retry logic
  async callEdgeFunction(endpoint, body, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch(`${this.supabaseUrl}/functions/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        return await response.json();
      } catch (error) {
        // Retry on failure with exponential backoff
        if (i === retries - 1) throw error;
        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }

  // Generate a personalized workout plan via Edge Function
  async generateWorkoutPlan(userProfile, preferences) {
    try {
      const response = await this.callEdgeFunction('generate-plan', {
        userProfile,
        preferences
      });

      if (!response.success) {
        throw new Error(response.error || 'Plan generation failed');
      }

      return {
        success: true,
        plan: response.plan,
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Chat with the AI coach via Edge Function
  async chatWithCoach(message, userProfile, currentPlan = null) {
    try {
      const response = await this.callEdgeFunction('chat-coach', {
        message,
        userProfile,
        currentPlan,
        conversationHistory: this.conversationHistory
      });

      if (!response.success) {
        throw new Error(response.error || 'Chat failed');
      }

      const aiResponse = response.message;

      // Persist the successful turn for future context
      this.conversationHistory.push({
        role: "user",
        content: message
      });
      
      // Add AI response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: aiResponse
      });

      return {
        success: true,
        message: aiResponse,
        usage: response.usage,
        planAction: response.planAction || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get daily motivation and tips via Edge Function
  async getDailyMotivation(userProfile, progressData = {}) {
    try {
      // Ensure progressData is not null
      if (!progressData || typeof progressData !== 'object') {
        progressData = {};
      }

      const response = await this.callEdgeFunction('daily-motivation', {
        userProfile,
        progressData
      });

      if (!response.success) {
        throw new Error(response.error || 'Motivation generation failed');
      }

      return {
        success: true,
        motivation: response.motivation,
        usage: response.usage
      };
    } catch (error) {
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
          if (day.workout?.type) {
            workoutTypes.add(day.workout.type);
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
          if (day.day_name) {
            availableDays.add(day.day_name);
          }
        });
      }
    });
    
    return Array.from(availableDays).join(', ') || 'Not specified';
  }

  // Build workout plan prompt
  buildWorkoutPlanPrompt(userProfile, preferences) {
    // Helper function to sort days in correct week order
    const sortDaysOfWeek = (days) => {
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return days.sort((a, b) => {
        return dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase());
      });
    };

    // Extract selected workout types
    const selectedWorkoutTypes = Object.entries(preferences?.workoutTypes || {})
      .filter(([type, selected]) => selected)
      .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1))
      .join(', ');

    // Extract selected available days and sort them in correct order
    const selectedDaysRaw = Object.entries(preferences?.availableDays || {})
      .filter(([day, selected]) => selected)
      .map(([day]) => day);
    
    const selectedDaysSorted = sortDaysOfWeek(selectedDaysRaw);
    const selectedDays = selectedDaysSorted
      .map(day => day.charAt(0).toUpperCase() + day.slice(1))
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

    // ✅ Build dynamic example format based on actual selected days (sorted in correct order)
    const selectedDaysArray = selectedDaysSorted
      .map(day => day.charAt(0).toUpperCase() + day.slice(1));
    
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
