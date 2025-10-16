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
  }

  // Generate a personalized workout plan
  async generateWorkoutPlan(userProfile, preferences) {
    try {
      const prompt = this.buildWorkoutPlanPrompt(userProfile, preferences);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
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

      const response = await openai.chat.completions.create({
        model: "gpt-4",
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
  async getDailyMotivation(userProfile) {
    try {
      const prompt = `Provide a brief, encouraging daily motivation message for a fitness enthusiast. 
      User profile: ${userProfile?.display_name || 'User'}, 
      Goal: ${userProfile?.goal?.type || 'general fitness'}, 
      Current focus: walking and strength training. 
      Keep it under 100 words and make it personal and motivating.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are StrideCoach, a motivational fitness AI coach. Provide encouraging, personalized daily motivation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.9
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