# 🚀 SUPABASE EDGE FUNCTIONS DEPLOYMENT GUIDE

## 🎯 **WHAT YOU NEED TO DO**

Your app is failing because we created Supabase Edge Functions in Phase 1, but they haven't been deployed to your Supabase project yet. Here's how to fix it:

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Login to Supabase CLI**

```bash
cd "/Users/edgarjobkerario/Coding Projects/Fitness App/StrideCoach"
npx supabase login
```

This will open your browser to authenticate with Supabase.

### **Step 2: Link to Your Project**

```bash
npx supabase link --project-ref mgbkrotqvafroqprmpik
```

### **Step 3: Deploy Edge Functions**

```bash
# Deploy all 3 Edge Functions
npx supabase functions deploy generate-plan
npx supabase functions deploy chat-coach  
npx supabase functions deploy daily-motivation
```

### **Step 4: Set OpenAI API Key (CRITICAL)**

You need to set your OpenAI API key in Supabase:

```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
npx supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

**Replace `your-openai-api-key-here` with your actual OpenAI API key!**

---

## 🔑 **WHERE TO GET YOUR OPENAI API KEY**

1. Go to: https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Use it in Step 4 above

---

## ✅ **VERIFICATION**

After deployment, test the functions:

```bash
# Test plan generation
npx supabase functions invoke generate-plan --data '{"userProfile":{"name":"Test User","age":25},"preferences":{"goal":"fitness"}}'

# Test chat
npx supabase functions invoke chat-coach --data '{"message":"Hello","userProfile":{"name":"Test"}}'

# Test motivation
npx supabase functions invoke daily-motivation --data '{"userProfile":{"name":"Test"}}'
```

---

## 🎯 **WHAT THIS FIXES**

**Before:** App tries to call Edge Functions that don't exist → Error
**After:** Edge Functions deployed → App works perfectly ✅

---

## 📱 **AFTER DEPLOYMENT**

Once you complete these steps:

1. **Reload your browser** (⌘+R or Ctrl+R)
2. **App should load successfully**
3. **You can generate workout plans**
4. **You can chat with AI coach**
5. **You can get daily motivation**

---

## 🆘 **IF YOU GET ERRORS**

**Error: "Not logged in"**
- Run: `npx supabase login` again

**Error: "Project not found"**
- Check your project ref: `mgbkrotqvafroqprmpik`

**Error: "Function not found"**
- Make sure you're in the StrideCoach directory
- Check that `supabase/functions/` folder exists

**Error: "OpenAI API key invalid"**
- Get a fresh API key from OpenAI platform
- Make sure it starts with `sk-`

---

## 📚 **WHAT ARE EDGE FUNCTIONS?**

**Simple Explanation:**
- Edge Functions = Server-side code that runs in Supabase cloud
- They handle AI calls securely (OpenAI API key never exposed to client)
- They provide rate limiting and cost control
- They're like "mini-servers" for specific tasks

**Why We Need Them:**
- Security: OpenAI API key stays server-side
- Cost Control: Rate limiting prevents abuse
- Performance: Faster than client-side calls
- Reliability: Always available in Supabase cloud

---

## 🎉 **READY TO DEPLOY?**

Run these commands in order:

```bash
# 1. Login
npx supabase login

# 2. Link project  
npx supabase link --project-ref mgbkrotqvafroqprmpik

# 3. Deploy functions
npx supabase functions deploy generate-plan
npx supabase functions deploy chat-coach
npx supabase functions deploy daily-motivation

# 4. Set OpenAI key (replace with your actual key!)
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
npx supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

**Then reload your browser and the app should work! 🚀**

