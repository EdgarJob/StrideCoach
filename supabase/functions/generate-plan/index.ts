import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
const MAX_REQUESTS_PER_DAY = 50;

interface RateLimitCheck {
  count: number;
  recent_request?: Date;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    // 1. Verify JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Rate limit: check ai_events table for user's daily usage
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from("ai_events")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("kind", "plan")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (recentRequests && recentRequests.length >= MAX_REQUESTS_PER_DAY) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Maximum ${MAX_REQUESTS_PER_DAY} plan generation requests per day`,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Parse request body
    const body = await req.json();
    const { userProfile, preferences } = body;

    if (!userProfile || !preferences) {
      return new Response(
        JSON.stringify({ error: "Missing userProfile or preferences" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Call OpenAI with server-side API key
    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are StrideCoach, an expert fitness AI coach specializing in walking and strength training. Create personalized, safe, and effective workout plans.",
          },
          {
            role: "user",
            content: buildWorkoutPlanPrompt(userProfile, preferences),
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const plan = data.choices[0].message.content;
    const usage = data.usage;

    // 5. Log usage to ai_events table
    const cost = calculateCost(usage.prompt_tokens, usage.completion_tokens, OPENAI_MODEL);
    await supabase.from("ai_events").insert({
      user_id: user.id,
      kind: "plan",
      provider: "openai",
      model: OPENAI_MODEL,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      cost_usd: cost,
    });

    const duration = Date.now() - startTime;
    console.log(`Plan generation completed in ${duration}ms`);

    // 6. Return result to client
    return new Response(
      JSON.stringify({
        success: true,
        plan: plan,
        usage: usage,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-plan function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

// Helper function to build workout plan prompt
function buildWorkoutPlanPrompt(userProfile: any, preferences: any): string {
  const selectedDays = Object.entries(preferences?.availableDays || {})
    .filter(([_, selected]: [string, any]) => selected)
    .map(([day]) => day)
    .join(", ");

  return `Create a 4-week personalized workout plan for:
User Details:
- Name: ${userProfile.name || "User"}
- Age: ${userProfile.age || "Not specified"}
- Height: ${userProfile.height_cm || "Not specified"} cm
- Weight: ${userProfile.weight_kg || "Not specified"} kg
- Goal: ${preferences?.goal || "General fitness"}
- Target Weight: ${userProfile.target_weight_kg || "Not specified"} kg
- Available Days: ${selectedDays || "Flexible"}
- Preferred Time: ${preferences?.preferredTime || "Not specified"}
- Equipment: ${preferences?.equipment || "None"}

Preferences:
- Workout Duration: ${preferences?.duration || 30} minutes
- Intensity Level: ${preferences?.intensityLevel || "Beginner"}
- Focus Areas: ${preferences?.focusAreas || "General fitness"}
- Workout Types: ${preferences?.workoutTypes?.join(", ") || "Walking, Strength"}

CRITICAL REQUIREMENTS:
1. You MUST create workouts for EXACTLY these days ONLY: ${selectedDays || "Monday, Wednesday, Friday"}
2. DO NOT include workouts for any other days
3. Each workout should be approximately ${preferences?.duration || 30} minutes
4. Focus on these workout types: ${preferences?.workoutTypes?.join(", ") || "Walking, Strength"}
5. Difficulty should match: ${preferences?.intensityLevel || "Beginner"}
6. Design VARIED workout types across the week (e.g., intervals, steady runs, tempo runs, etc.)
7. Don't force all workouts into the same structure - vary them based on training principles

Please create a structured 4-week progressive plan with warm-up, main workout, and cool-down for each day.`;
}

// Helper function to calculate cost (approximate)
function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  // Pricing as of 2024
  const pricing: { [key: string]: { prompt: number; completion: number } } = {
    "gpt-4o-mini": { prompt: 0.15 / 1000000, completion: 0.6 / 1000000 },
    "gpt-4": { prompt: 30 / 1000000, completion: 60 / 1000000 },
  };

  const rates = pricing[model] || pricing["gpt-4o-mini"];
  const cost = promptTokens * rates.prompt + completionTokens * rates.completion;
  return Math.round(cost * 1000000) / 1000000; // Round to 6 decimal places
}

