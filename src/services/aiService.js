import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here',
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
        max_tokens: 1500,
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
  async chatWithCoach(message, userProfile) {
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
            content: this.buildSystemPrompt(userProfile)
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
  buildSystemPrompt(userProfile) {
    return `You are StrideCoach, an expert AI fitness coach specializing in walking and strength training. 

User Profile:
- Name: ${userProfile?.display_name || 'User'}
- Age: ${userProfile?.age || 'Not specified'}
- Height: ${userProfile?.height_cm || 'Not specified'} cm
- Weight: ${userProfile?.weight_kg || 'Not specified'} kg
- Goal: ${userProfile?.goal?.type || 'General fitness'}
- Target Weight: ${userProfile?.goal?.target_weight || 'Not specified'} kg
- Workout Schedule: ${userProfile?.schedule?.days?.join(', ') || 'Not specified'}
- Equipment: ${userProfile?.equipment?.join(', ') || 'None'}

Guidelines:
- Be encouraging, supportive, and professional
- Focus on walking and strength training
- Provide safe, evidence-based advice
- Keep responses concise but helpful
- Ask clarifying questions when needed
- Never provide medical advice
- Encourage gradual progress and consistency`;
  }

  // Build workout plan prompt
  buildWorkoutPlanPrompt(userProfile, preferences) {
    return `Create a 4-week personalized workout plan for:

User Details:
- Name: ${userProfile?.display_name || 'User'}
- Age: ${userProfile?.age || 'Not specified'}
- Height: ${userProfile?.height_cm || 'Not specified'} cm
- Weight: ${userProfile?.weight_kg || 'Not specified'} kg
- Goal: ${userProfile?.goal?.type || 'General fitness'}
- Target Weight: ${userProfile?.goal?.target_weight || 'Not specified'} kg
- Available Days: ${userProfile?.schedule?.days?.join(', ') || 'Monday, Wednesday, Friday'}
- Preferred Time: ${userProfile?.schedule?.time || 'Not specified'}
- Equipment: ${userProfile?.equipment?.join(', ') || 'None (Bodyweight only)'}

Preferences:
- Workout Duration: ${preferences?.duration || '30-45 minutes'}
- Intensity Level: ${preferences?.intensity || 'Moderate'}
- Focus Areas: ${preferences?.focusAreas || 'General fitness'}

Please create a structured 4-week plan that includes:
1. Weekly overview
2. Daily workout breakdowns
3. Walking routes/suggestions
4. Strength exercises with progressions
5. Rest day recommendations
6. Weekly goals and milestones

Format the response in a clear, easy-to-follow structure.`;
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