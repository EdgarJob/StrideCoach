import { supabase } from './supabase';

// AI Coach Service - Now calls secure Supabase Edge Functions
export class AICoachService {
  constructor() {
    this.conversationHistory = [];
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    this.aiProvider = process.env.EXPO_PUBLIC_AI_PROVIDER || 'supabase';
    this.localAIBaseUrl = process.env.EXPO_PUBLIC_LOCAL_AI_BASE_URL || 'http://127.0.0.1:1234/v1';
    this.localAIModel = process.env.EXPO_PUBLIC_LOCAL_AI_MODEL || 'qwen/qwen3.5-35b-a3b';
  }

  isLocalAIEnabled() {
    return this.aiProvider === 'lmstudio' || this.aiProvider === 'local';
  }

  extractAssistantContent(message = {}) {
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    if (content) return content;

    const reasoning = typeof message.reasoning_content === 'string' ? message.reasoning_content : '';
    const outputMatch = reasoning.match(/(?:Output|Final(?: Answer)?):\s*([\s\S]+)$/i);
    if (outputMatch?.[1]?.trim()) return outputMatch[1].trim();

    const revisedMatch = reasoning.match(/\*Revised:\*\s*"([^"]+)"/i);
    if (revisedMatch?.[1]?.trim()) return revisedMatch[1].trim();

    const draftMatches = [...reasoning.matchAll(/\*Draft \d+:\*\s*"([^"]+)"/gi)];
    const lastDraft = draftMatches[draftMatches.length - 1]?.[1]?.trim();
    if (lastDraft) return lastDraft;

    return '';
  }

  parseCoachResponse(rawContent) {
    let parsed = null;

    try {
      parsed = JSON.parse(rawContent);
    } catch (_) {
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(rawContent.slice(firstBrace, lastBrace + 1));
        } catch (_) {
          parsed = null;
        }
      }
    }

    const fallbackMessage = rawContent?.trim() || 'I can help with that. What would you like to adjust?';
    return {
      message: typeof parsed?.message === 'string' && parsed.message.trim() ? parsed.message.trim() : fallbackMessage,
      planAction: this.sanitizePlanAction(parsed?.planAction)
    };
  }

  sanitizePlanAction(planAction) {
    if (!planAction || typeof planAction !== 'object' || planAction.type !== 'propose_plan_update') {
      return null;
    }

    const allowedKeys = new Set([
      'workoutTypes',
      'availableDays',
      'workoutDuration',
      'difficultyLevel',
      'primaryGoal',
      'preferredTime',
      'hasEquipment',
    ]);
    const preferenceUpdates = {};

    Object.entries(planAction.preferenceUpdates || {}).forEach(([key, value]) => {
      if (allowedKeys.has(key)) {
        preferenceUpdates[key] = value;
      }
    });

    if (Object.keys(preferenceUpdates).length === 0) return null;

    return {
      type: 'propose_plan_update',
      summary: planAction.summary || 'Proposed workout plan changes',
      confirmationPrompt: planAction.confirmationPrompt || 'Do you want me to apply these workout plan changes now?',
      preferenceUpdates,
    };
  }

  async callLocalAI(messages, options = {}) {
    const response = await fetch(`${this.localAIBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.localAIModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Local AI request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
      } catch (_) {
        errorMessage = await response.text();
      }
      throw new Error(`LM Studio HTTP ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message || {};
    return {
      content: this.extractAssistantContent(assistantMessage),
      usage: data.usage || null,
    };
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
        console.error(`Edge Function "${endpoint}" failed:`, error.message);
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
      if (this.isLocalAIEnabled()) {
        const weekPlans = [];

        for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
          const result = await this.callLocalAI([
            {
              role: 'system',
              content: 'You are StrideCoach, an expert fitness coach. Generate safe, concise, parsable workout plans. Output only markdown, no commentary.',
            },
            {
              role: 'user',
              content: this.buildWeeklyWorkoutPlanPrompt(userProfile, preferences, weekNumber),
            },
          ], { maxTokens: 3000, temperature: 0.65 });

          const weekContent = result.content?.trim() || '';
          weekPlans.push(
            weekContent.startsWith(`### Week ${weekNumber}`)
              ? weekContent
              : `### Week ${weekNumber}\n${weekContent}`
          );
        }

        return {
          success: true,
          plan: `## Daily Workout Breakdown\n\n${weekPlans.join('\n\n')}`,
          usage: null,
        };
      }

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
      if (this.isLocalAIEnabled()) {
        const systemPrompt = `${this.buildSystemPrompt(userProfile, currentPlan)}

You MUST return a JSON object with this exact shape:
{
  "message": "normal coach reply for the user",
  "planAction": null OR {
    "type": "propose_plan_update",
    "summary": "short summary of proposed changes",
    "confirmationPrompt": "short yes/no question asking for explicit confirmation",
    "preferenceUpdates": { "availableDays": { "monday": true } }
  }
}

Only set planAction when the user explicitly asks to create, edit, or adjust a workout plan.`;

        const result = await this.callLocalAI([
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
          { role: 'user', content: message },
        ], {
          maxTokens: 2200,
          temperature: 0.7,
        });

        const parsedResponse = this.parseCoachResponse(result.content);

        this.conversationHistory.push({ role: 'user', content: message });
        this.conversationHistory.push({ role: 'assistant', content: parsedResponse.message });

        return {
          success: true,
          message: parsedResponse.message,
          usage: result.usage,
          planAction: parsedResponse.planAction || null,
        };
      }

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

  // Modify an existing plan (or create new) based on conversation history
  async modifyPlan(userProfile, currentPlan, conversationHistory) {
    try {
      if (this.isLocalAIEnabled()) {
        const recentMessages = (conversationHistory || [])
          .slice(-20)
          .map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
          .join('\n');

        const weekPlans = [];

        for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
          const result = await this.callLocalAI([
            {
              role: 'system',
              content: 'You are StrideCoach, an expert fitness coach. Generate safe, concise, parsable workout plans. Output only markdown.',
            },
            {
              role: 'user',
              content: `Create or modify Week ${weekNumber} of a complete 4-week workout plan from this context.

USER PROFILE:
${JSON.stringify(userProfile || {}, null, 2)}

CURRENT PLAN:
${JSON.stringify(currentPlan || null, null, 2)}

CONVERSATION:
${recentMessages}

Output ONLY this one week in markdown using this exact structure:
### Week ${weekNumber}
**Monday**
Warm-Up:
Main Workout:
Cool Down:

Include every selected workout day for Week ${weekNumber}. Do not output any other week.`,
            },
          ], { maxTokens: 3000, temperature: 0.65 });

          const weekContent = result.content?.trim() || '';
          weekPlans.push(
            weekContent.startsWith(`### Week ${weekNumber}`)
              ? weekContent
              : `### Week ${weekNumber}\n${weekContent}`
          );
        }

        return {
          success: true,
          plan: `## Daily Workout Breakdown\n\n${weekPlans.join('\n\n')}`,
          usage: null,
        };
      }

      const response = await this.callEdgeFunction('modify-plan', {
        userProfile,
        currentPlan,
        conversationHistory
      });

      if (!response.success) {
        throw new Error(response.error || 'Plan modification failed');
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

  // Get daily motivation and tips via Edge Function
  async getDailyMotivation(userProfile, progressData = {}) {
    try {
      // Ensure progressData is not null
      if (!progressData || typeof progressData !== 'object') {
        progressData = {};
      }

      if (this.isLocalAIEnabled()) {
        const result = await this.callLocalAI([
          {
            role: 'system',
            content: "You are StrideCoach's motivation engine. Write short, practical, upbeat fitness motivation. Output only the message.",
          },
          {
            role: 'user',
            content: `Generate a personalized daily motivation under 60 words.
User: ${userProfile?.display_name || userProfile?.name || 'User'}
Goal: ${JSON.stringify(userProfile?.goal || 'General fitness')}
Progress: ${JSON.stringify(progressData || {})}`,
          },
        ], { maxTokens: 800, temperature: 0.8 });

        return {
          success: true,
          motivation: result.content,
          usage: result.usage,
        };
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
  buildWeeklyWorkoutPlanPrompt(userProfile, preferences, weekNumber) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const selectedDays = Object.entries(preferences?.availableDays || {})
      .filter(([_, selected]) => selected)
      .map(([day]) => day)
      .sort((a, b) => dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase()))
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1));

    const workoutTypes = Object.entries(preferences?.workoutTypes || {})
      .filter(([_, selected]) => selected)
      .map(([type]) => type.replace(/_/g, ' '))
      .join(', ') || 'walking, strength';

    const equipment = Object.entries(preferences?.hasEquipment || {})
      .filter(([_, selected]) => selected)
      .map(([item]) => item.replace(/_/g, ' '))
      .join(', ') || 'none';

    const days = selectedDays.length > 0 ? selectedDays : ['Monday', 'Wednesday', 'Friday'];
    const dayTemplate = days
      .map((day) => `**${day}**
- Warm-Up:
  - 1-2 concise warm-up movements
- Main Workout:
  - 3-5 concise exercises or walking/running blocks
- Cool Down:
  - 1-2 concise cool-down stretches`)
      .join('\n\n');

    return `Create ONLY Week ${weekNumber} of a 4-week progressive workout plan.

User:
- Name: ${userProfile?.display_name || 'New User'}
- Age: ${userProfile?.age || 25}
- Weight: ${userProfile?.weight_kg || 70} kg
- Goal: ${preferences?.primaryGoal?.replace(/_/g, ' ') || userProfile?.goal?.type || 'general fitness'}
- Difficulty: ${preferences?.difficultyLevel || 'beginner'}
- Workout duration: ${preferences?.workoutDuration || 30} minutes
- Workout types: ${workoutTypes}
- Equipment: ${equipment}

Rules:
- Output ONLY markdown.
- Output EXACTLY one week: ### Week ${weekNumber}
- Include workouts ONLY for these days: ${days.join(', ')}
- Do not include rest days.
- Keep each day concise so the whole week fits.
- Make Week ${weekNumber} progressive: Week 1 foundation, Week 2 build, Week 3 challenge, Week 4 peak or deload.

Required format:
### Week ${weekNumber}
Focus: ${this.getWeekFocusLabel(weekNumber)}

${dayTemplate}`;
  }

  getWeekFocusLabel(weekNumber) {
    const focusByWeek = {
      1: 'Foundation Building',
      2: 'Progressive Overload',
      3: 'Intensity Increase',
      4: 'Peak Performance',
    };
    return focusByWeek[weekNumber] || 'General Fitness';
  }

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
