// deno-lint-ignore-file
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
const MAX_REQUESTS_PER_DAY = 50;

serve(async (req) => {
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
    // Create client with user's JWT token so RLS policies work correctly
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

    // Rate limiting
    const { data: recentRequests } = await supabase
      .from("ai_events")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("kind", "chat")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentRequests && recentRequests.length >= MAX_REQUESTS_PER_DAY) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Maximum ${MAX_REQUESTS_PER_DAY} chat requests per day`,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { message, userProfile, currentPlan, conversationHistory } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(userProfile, currentPlan);
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const assistantRawMessage = data.choices?.[0]?.message?.content || "";
    const parsedResponse = parseCoachResponse(assistantRawMessage);
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    const cost = calculateCost(promptTokens, completionTokens, OPENAI_MODEL);
    await supabase.from("ai_events").insert({
      user_id: user.id,
      kind: "chat",
      provider: "openai",
      model: OPENAI_MODEL,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost_usd: cost,
    });

    const duration = Date.now() - startTime;
    console.log(`Chat response completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: parsedResponse.message,
        planAction: parsedResponse.planAction,
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
    console.error("Error in chat-coach function:", error);
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

function buildSystemPrompt(userProfile: any, currentPlan: any): string {
  const planPreferenceSummary = currentPlan?.preferences
    ? JSON.stringify(currentPlan.preferences)
    : "Not available";

  return `You are StrideCoach, a supportive and knowledgeable AI fitness coach. 
You specialize in walking and strength training programs.

User Profile: ${userProfile ? JSON.stringify(userProfile) : "Not available"}
Current Plan: ${currentPlan ? "Available" : "No active plan"}
Current Plan Preferences: ${planPreferenceSummary}

You MUST return a JSON object with this exact shape:
{
  "message": "normal coach reply for the user",
  "planAction": null OR {
    "type": "propose_plan_update",
    "summary": "short summary of proposed changes",
    "confirmationPrompt": "short yes/no question asking for explicit confirmation",
    "preferenceUpdates": { partial preference updates object }
  }
}

Guidelines:
- Be supportive, encouraging, and empathetic
- Keep responses under 150 words
- Provide one actionable piece of advice per response
- Reference the user's current workout plan when relevant
- Keep nutrition advice general (encourage healthy habits, not prescriptions)
- Be enthusiastic about progress, no matter how small
- Only set planAction when the user explicitly asks to create, edit, or adjust a workout plan
- Never claim plan changes are saved until user confirms
- If no current plan exists and user asks for plan changes, propose creating one using planAction
- For rest-day or schedule-change requests, make incremental changes by default (usually remove 1-2 workout days), unless user explicitly requests a very low-frequency plan
- When changing availableDays, only change what is necessary for the request and avoid turning unrelated days off
- Include day-count impact in summary when availableDays changes (example: "Workout days: 7 -> 5")
- preferenceUpdates must only use these top-level keys: workoutTypes, availableDays, workoutDuration, difficultyLevel, primaryGoal, preferredTime, hasEquipment`;
}

function parseCoachResponse(rawContent: string): { message: string; planAction: any | null } {
  let parsed: any = null;

  try {
    parsed = JSON.parse(rawContent);
  } catch (_) {
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = rawContent.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(possibleJson);
      } catch (_) {
        parsed = null;
      }
    }
  }

  const fallbackMessage = "I can help with that. Do you want me to update your workout plan?";
  const message = typeof parsed?.message === "string" && parsed.message.trim().length > 0
    ? parsed.message.trim()
    : (typeof rawContent === "string" && rawContent.trim().length > 0 ? rawContent.trim() : fallbackMessage);

  const planAction = sanitizePlanAction(parsed?.planAction);
  return { message, planAction };
}

function sanitizePlanAction(planAction: any): any | null {
  if (!planAction || typeof planAction !== "object") {
    return null;
  }

  if (planAction.type !== "propose_plan_update") {
    return null;
  }

  const preferenceUpdates = sanitizePreferenceUpdates(planAction.preferenceUpdates);
  if (Object.keys(preferenceUpdates).length === 0) {
    return null;
  }

  const summary = typeof planAction.summary === "string" && planAction.summary.trim().length > 0
    ? planAction.summary.trim()
    : "Proposed workout plan changes";

  const confirmationPrompt =
    typeof planAction.confirmationPrompt === "string" && planAction.confirmationPrompt.trim().length > 0
      ? planAction.confirmationPrompt.trim()
      : "Do you want me to apply these workout plan changes now?";

  return {
    type: "propose_plan_update",
    summary,
    confirmationPrompt,
    preferenceUpdates,
  };
}

function sanitizePreferenceUpdates(raw: any): Record<string, any> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const sanitized: Record<string, any> = {};
  const allowedKeys = new Set([
    "workoutTypes",
    "availableDays",
    "workoutDuration",
    "difficultyLevel",
    "primaryGoal",
    "preferredTime",
    "hasEquipment",
  ]);

  for (const [key, value] of Object.entries(raw)) {
    if (!allowedKeys.has(key)) continue;

    if (key === "workoutDuration" && typeof value === "number" && Number.isFinite(value)) {
      sanitized[key] = Math.max(10, Math.min(180, Math.round(value)));
      continue;
    }

    if ((key === "difficultyLevel" || key === "primaryGoal" || key === "preferredTime") && typeof value === "string") {
      sanitized[key] = value.trim();
      continue;
    }

    if ((key === "workoutTypes" || key === "availableDays" || key === "hasEquipment") &&
      value && typeof value === "object" && !Array.isArray(value)) {
      const nested: Record<string, boolean> = {};
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === "boolean") {
          nested[nestedKey] = nestedValue;
        }
      }
      if (Object.keys(nested).length > 0) {
        sanitized[key] = nested;
      }
    }
  }

  return sanitized;
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
