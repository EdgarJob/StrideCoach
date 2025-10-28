# Supabase Edge Functions Deployment Guide

## Overview
The OpenAI API calls have been moved from client-side to secure Supabase Edge Functions. This provides:
- ✅ API key security (no longer exposed in client)
- ✅ Rate limiting (50 requests/day per user)
- ✅ Usage tracking & cost monitoring
- ✅ Retry logic with exponential backoff

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Supabase account and project created
3. OpenAI API key

## Step 1: Link Your Supabase Project

```bash
cd StrideCoach
supabase link --project-ref your-project-ref
```

Get your project ref from: Supabase Dashboard → Settings → General → Project ID

## Step 2: Set Environment Variables (Secrets)

The Edge Functions need these secrets:

```bash
# Set OpenAI API key (server-side only)
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here

# Set OpenAI model (optional, defaults to gpt-4o-mini)
supabase secrets set OPENAI_MODEL=gpt-4o-mini

# Set Supabase credentials (for Edge Functions to access database)
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Deploy the Edge Functions

Deploy all three functions:

```bash
# Deploy generate-plan function
supabase functions deploy generate-plan

# Deploy chat-coach function
supabase functions deploy chat-coach

# Deploy daily-motivation function
supabase functions deploy daily-motivation
```

## Step 4: Run the SQL Migration

Apply the RLS policies and create the ai_events table:

```bash
# In Supabase Dashboard: SQL Editor → New Query
# Copy and paste the contents of:
supabase/migrations/002_rls_and_rate_limiting.sql

# Then click "Run"
```

Or use the CLI:
```bash
supabase db push
```

## Step 5: Update Client Environment Variables

Create a `.env` file in the StrideCoach root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** The OpenAI key is NO LONGER needed on the client. It's now server-side only.

## Step 6: Update Netlify Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, ensure these are set:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Verification

Test each endpoint:

### Test generate-plan:
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/generate-plan \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userProfile": {...}, "preferences": {...}}'
```

### Test chat-coach:
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/chat-coach \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I improve my running?", "userProfile": {...}}'
```

### Test daily-motivation:
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/daily-motivation \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userProfile": {...}, "progressData": {...}}'
```

## Monitoring

View Edge Function logs:
```bash
supabase functions logs generate-plan
supabase functions logs chat-coach  
supabase functions logs daily-motivation
```

View AI usage & costs:
```sql
-- In Supabase SQL Editor
SELECT 
  kind,
  COUNT(*) as requests,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(cost_usd) as total_cost
FROM ai_events
WHERE user_id = 'your-user-id'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY kind;
```

## Rate Limiting

Current limits:
- Plan generation: 50 requests/day per user
- Chat: 50 requests/day per user
- Motivation: unlimited (called by system)

To adjust, edit the `MAX_REQUESTS_PER_DAY` constant in each Edge Function.

## Troubleshooting

### "No authorization header" error
- Ensure user is logged in and session token is being sent
- Check that `Authorization: Bearer <token>` header is present

### "Rate limit exceeded" error
- User has hit the 50 requests/day limit
- Check ai_events table for their usage
- Consider increasing limit or implementing tier-based limits

### "OpenAI API error"
- Check that OPENAI_API_KEY secret is set correctly
- Verify OpenAI API key has sufficient credits
- Check Edge Function logs for detailed error

### Edge Function times out
- Check OpenAI API status
- Consider increasing max_tokens for plan generation
- Review Edge Function logs for bottlenecks

## Cost Estimation

Based on gpt-4o-mini pricing:
- Plan generation: ~$0.002 per request (4000 tokens)
- Chat: ~$0.0005 per message (500 tokens)
- Motivation: ~$0.0002 per request (200 tokens)

With 50 requests/day limit:
- Max daily cost per user: ~$0.125
- Max monthly cost (1000 users): ~$3,750

## Security Checklist

- ✅ OpenAI API key is server-side only (in Supabase secrets)
- ✅ All Edge Functions require JWT authentication
- ✅ Rate limiting prevents abuse
- ✅ RLS policies enforce user data isolation
- ✅ Usage is logged to ai_events table
- ✅ Client no longer has `dangerouslyAllowBrowser: true`

## Next Steps

1. Deploy Edge Functions to Supabase
2. Run SQL migration for RLS & ai_events table
3. Set up environment variables (client & Netlify)
4. Test each endpoint with real user session
5. Monitor logs and costs for first week
6. Implement offline caching for better UX
7. Add comprehensive unit tests

