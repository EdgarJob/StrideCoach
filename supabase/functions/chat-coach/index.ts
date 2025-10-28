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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    const usage = data.usage;

    const cost = calculateCost(usage.prompt_tokens, usage.completion_tokens, OPENAI_MODEL);
    await supabase.from("ai_events").insert({
      user_id: user.id,
      kind: "chat",
      provider: "openai",
      model: OPENAI_MODEL,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      cost_usd: cost,
    });

    const duration = Date.now() - startTime;
    console.log(`Chat response completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
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
    console.error("Error in chat-coach function:", error);
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

function buildSystemPrompt(userProfile: any, currentPlan: any): string {
  return `You are StrideCoach, a supportive and knowledgeable AI fitness coach. 
You specialize in walking and strength training programs.

User Profile: ${userProfile ? JSON.stringify(userProfile) : "Not available"}
Current Plan: ${currentPlan ? "Available" : "No active plan"}

Guidelines:
- Be supportive, encouraging, and empathetic
- Keep responses under 150 words
- Provide one actionable piece of advice per response
- Reference the user's current workout plan when relevant
- Keep nutrition advice general (encourage healthy habits, not prescriptions)
- Be enthusiastic about progress, no matter how small`;
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

