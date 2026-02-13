// deno-lint-ignore-file
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
const MAX_REQUESTS_PER_DAY = 50;

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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

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

    // 2. Rate limit: shares the "plan" pool with generate-plan
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
    const { userProfile, currentPlan, conversationHistory } = body;

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: "Missing userProfile" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Build the modification prompt
    const prompt = buildModifyPlanPrompt(userProfile, currentPlan, conversationHistory);

    // 5. Call OpenAI
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
              "You are StrideCoach, an expert fitness AI coach specializing in walking and strength training. You modify and create personalized, safe, and effective workout plans based on user conversations with their AI coach.",
          },
          {
            role: "user",
            content: prompt,
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

    // 6. Log usage to ai_events table
    const cost = calculateCost(usage.prompt_tokens, usage.completion_tokens, OPENAI_MODEL);
    const { error: insertError } = await supabase.from("ai_events").insert({
      user_id: user.id,
      kind: "plan",
      provider: "openai",
      model: OPENAI_MODEL,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      cost_usd: cost,
    });

    if (insertError) {
      console.error("Failed to log AI usage to ai_events:", insertError);
    }

    const duration = Date.now() - startTime;
    console.log(`Plan modification completed in ${duration}ms`);

    // 7. Return result
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
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error in modify-plan function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
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

function buildModifyPlanPrompt(userProfile: any, currentPlan: any, conversationHistory: any[]): string {
  // Build conversation context (last 20 messages)
  const recentMessages = (conversationHistory || []).slice(-20);
  const conversationText = recentMessages
    .map((msg: any) => `${msg.role === "user" ? "User" : "Coach"}: ${msg.content}`)
    .join("\n");

  if (currentPlan) {
    // Extract current plan summary
    const planTitle = currentPlan.title || "4-Week Fitness Plan";
    const totalWeeks = currentPlan.weeks?.length || 4;
    const preferences = currentPlan.preferences || {};

    const selectedDays = Object.entries(preferences.availableDays || {})
      .filter(([_, selected]: [string, any]) => selected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(", ");

    const workoutTypes = Object.entries(preferences.workoutTypes || {})
      .filter(([_, selected]: [string, any]) => selected)
      .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1))
      .join(", ");

    const weekSummaries = (currentPlan.weeks || []).map((week: any) => {
      const dayNames = (week.days || []).map((d: any) => d.day_name).join(", ");
      return `Week ${week.week_number}: ${week.focus || "General"} - Days: ${dayNames}`;
    }).join("\n");

    return `Modify this existing workout plan based on what the user discussed with their AI coach.

CURRENT PLAN SUMMARY:
- Title: ${planTitle}
- Total Weeks: ${totalWeeks}
- Workout Days: ${selectedDays || "Not specified"}
- Workout Types: ${workoutTypes || "Not specified"}
- Duration: ${preferences.workoutDuration || 30} minutes per session
- Difficulty: ${preferences.difficultyLevel || "Beginner"}
- Goal: ${preferences.primaryGoal || "General fitness"}

WEEK BREAKDOWN:
${weekSummaries}

USER PROFILE:
- Name: ${userProfile.display_name || userProfile.name || "User"}
- Age: ${userProfile.age || "Not specified"}
- Height: ${userProfile.height_cm || "Not specified"} cm
- Weight: ${userProfile.weight_kg || "Not specified"} kg

CONVERSATION WITH COACH (what the user wants changed):
${conversationText}

INSTRUCTIONS:
1. Generate a COMPLETE modified 4-week plan incorporating the changes discussed
2. Keep the same general structure unless the user asked to change it
3. Maintain progressive difficulty across weeks
4. Use the same markdown format: ### Week N, **DayName**, with Warm-Up, Main Workout, Cool Down sections
5. Only change what the user asked to change - keep everything else similar
6. Each workout should have clear exercises with sets/reps or distances/times

CRITICAL: Output ONLY the plan in markdown format. Do not include explanations or commentary outside the plan structure.

## Daily Workout Breakdown

### Week 1
[Generate workouts for the appropriate days]

### Week 2
[Generate workouts with progression]

### Week 3
[Generate workouts with continued progression]

### Week 4
[Generate peak/recovery week workouts]`;
  } else {
    // No current plan - create a new one based on conversation
    return `Create a new workout plan based on what the user discussed with their AI coach.

USER PROFILE:
- Name: ${userProfile.display_name || userProfile.name || "User"}
- Age: ${userProfile.age || "Not specified"}
- Height: ${userProfile.height_cm || "Not specified"} cm
- Weight: ${userProfile.weight_kg || "Not specified"} kg
- Goal: ${userProfile.goal?.type || "General fitness"}

CONVERSATION WITH COACH (what the user wants):
${conversationText}

INSTRUCTIONS:
1. Generate a COMPLETE 4-week plan based on what was discussed in the conversation
2. If specific days were mentioned, use those. Otherwise, default to Monday, Wednesday, Friday
3. If specific workout types were mentioned, use those. Otherwise, use Walking and Strength
4. If duration was mentioned, use it. Otherwise, default to 30 minutes
5. Include progressive difficulty across the 4 weeks
6. Use this markdown format: ### Week N, **DayName**, with Warm-Up, Main Workout, Cool Down sections
7. Each workout should have clear exercises with sets/reps or distances/times

CRITICAL: Output ONLY the plan in markdown format. Do not include explanations or commentary outside the plan structure.

## Daily Workout Breakdown

### Week 1
[Generate workouts]

### Week 2
[Generate workouts with progression]

### Week 3
[Generate workouts with continued progression]

### Week 4
[Generate peak/recovery week workouts]`;
  }
}

function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing: { [key: string]: { prompt: number; completion: number } } = {
    "gpt-4o-mini": { prompt: 0.15 / 1000000, completion: 0.6 / 1000000 },
    "gpt-4": { prompt: 30 / 1000000, completion: 60 / 1000000 },
  };

  const rates = pricing[model] || pricing["gpt-4o-mini"];
  const cost = promptTokens * rates.prompt + completionTokens * rates.completion;
  return Math.round(cost * 1000000) / 1000000;
}
