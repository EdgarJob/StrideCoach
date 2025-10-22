# 🚂 Deploy StrideCoach to Railway - Simple Guide

Railway is a simpler, more beginner-friendly platform for deploying full-stack apps like StrideCoach.

---

## Why Railway?

✅ **Easier Setup** - Less configuration, more "just works"  
✅ **Better for Learning** - Clearer error messages and logs  
✅ **Full-Stack Friendly** - Great with Expo, Supabase, and Node.js  
✅ **Generous Free Tier** - $5 of free credits per month (plenty for development)

---

## Step-by-Step Deployment

### **Step 1: Create a Railway Account**

1. Go to **[railway.app](https://railway.app)**
2. Click **"Login"** in the top right
3. Sign in with your **GitHub account** (same one you use for StrideCoach)
4. Authorize Railway to access your repositories

**Why GitHub?** Railway connects directly to your GitHub repo, so every time you push code, it automatically redeploys. No manual uploads!

---

### **Step 2: Create a New Project**

1. Click **"New Project"** on your Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Find and select **"StrideCoach"** from the list
4. Railway will automatically detect it's a Node.js/Expo project

**What's happening?** Railway is reading your `package.json` and configuration files to understand how to build your app.

---

### **Step 3: Add Environment Variables**

Your app needs your API keys to work. Let's add them:

1. In your Railway project, click on the **"Variables"** tab
2. Click **"New Variable"** and add these one by one:

```
EXPO_PUBLIC_SUPABASE_URL = your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY = your_openai_api_key
```

**Where to find these?**
- **Supabase keys**: Go to your Supabase project → Settings → API
- **OpenAI key**: From your `.env` file in the project

**Why?** These are secret keys that shouldn't be in your code. Railway keeps them safe and injects them when your app runs.

---

### **Step 4: Deploy!**

1. Click the **"Deploy"** button (or it may auto-deploy)
2. Watch the build logs - you'll see:
   - ✅ Installing dependencies
   - ✅ Building web version with Expo
   - ✅ Starting the server
3. Wait 2-5 minutes for the first build

**What to look for in logs:**
- ✅ `Installing dependencies...` - Good!
- ✅ `Bundle complete` - Good!
- ✅ `Server running on port...` - Perfect!
- ❌ `Error:...` - Something went wrong (see troubleshooting below)

---

### **Step 5: Get Your Live URL**

1. Once deployed, click on **"Settings"** → **"Domains"**
2. Click **"Generate Domain"**
3. Railway will give you a URL like: `stridecoach-production.up.railway.app`
4. Click it to open your live app! 🎉

---

## Testing Your Deployment

Visit your Railway URL and try:

1. **Sign Up** - Create a new account
2. **Login** - Sign in with your test account
3. **Generate a Plan** - Make sure AI is working
4. **Navigate Around** - Check all tabs work

---

## Troubleshooting Common Issues

### ❌ **Build Failed: "Cannot find module"**

**Problem:** Missing dependency in `package.json`

**Fix:** We've already added all dependencies, but if you see this:
1. Check the error message for which module is missing
2. Add it to `package.json` dependencies
3. Push to GitHub (Railway will auto-redeploy)

---

### ❌ **App Loads but Shows Blank Screen**

**Problem:** Environment variables not set

**Fix:**
1. Go to Railway dashboard → Variables
2. Double-check all three environment variables are there
3. Click "Restart" to reload with new variables

---

### ❌ **Build Succeeds but App Won't Start**

**Problem:** Port configuration issue

**Fix:** Already handled in our `nixpacks.toml` - Railway uses `$PORT` automatically

---

## How Auto-Deployment Works

Once set up, Railway is **automatic**:

1. You make changes to your code locally
2. You push to GitHub (`git push origin main`)
3. Railway detects the change
4. Railway automatically rebuilds and redeploys
5. Your live site updates in 2-5 minutes

**No manual steps needed!** 🚀

---

## Viewing Logs (When Something Goes Wrong)

1. Go to your Railway project
2. Click on **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**

You'll see everything your app is doing - errors, API calls, etc.

---

## Cost & Limits

Railway gives you:
- **$5 free credits per month**
- Each credit = 1 hour of server time
- Your app uses about $0.01-0.02 per hour
- That's ~250 hours free = plenty for development!

**When you're ready for production**, you can upgrade for $5-20/month.

---

## Next Steps After Deployment

### ✅ **Web App is Live** - What about mobile?

Railway hosts your **web version**. For mobile apps (iOS/Android):

1. **Option A:** Use **Expo Go** app (easiest for testing)
2. **Option B:** Build standalone apps with **EAS Build** (for app stores)

We can set this up separately once your web app is working!

---

## Need Help?

If something goes wrong:

1. **Check the logs** in Railway dashboard
2. **Copy the error message** and share it with me
3. I'll help you fix it step by step!

---

**Ready to deploy? Let's push these changes to GitHub first!**

