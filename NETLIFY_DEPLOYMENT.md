# 🌐 Deploy StrideCoach to Netlify - Super Simple Guide

Netlify is the **easiest** platform for deploying static web apps like StrideCoach. It's perfect for beginners!

---

## Why Netlify?

✅ **Simplest Setup** - Just connect GitHub and it works!  
✅ **Perfect for Expo Web** - Excellent support for React/React Native web builds  
✅ **Free Forever** - Generous free tier with no time limits  
✅ **Auto-Deploy** - Every GitHub push = automatic deployment  
✅ **Custom Domains** - Easy to add your own domain later  

---

## Step-by-Step Deployment

### **Step 1: Create a Netlify Account**

1. Go to **[netlify.com](https://netlify.com)**
2. Click **"Sign up"** in the top right
3. Choose **"Sign up with GitHub"** (same account as StrideCoach)
4. Authorize Netlify to access your repositories

**Why GitHub?** Netlify connects directly to your GitHub repo, so every time you push code, it automatically redeploys. No manual uploads!

---

### **Step 2: Deploy from GitHub**

1. Once logged in, click **"New site from Git"**
2. Choose **"GitHub"** as your Git provider
3. Find and select **"StrideCoach"** from the list
4. Netlify will automatically detect it's a Node.js project

**What's happening?** Netlify reads your `netlify.toml` file and `package.json` to understand how to build your app.

---

### **Step 3: Configure Build Settings**

Netlify should auto-detect these settings from your `netlify.toml` file:

- **Build command:** `npm run build:web`
- **Publish directory:** `web-build`
- **Node version:** `18`

If it doesn't auto-detect, manually enter:
- **Build command:** `npm run build:web`
- **Publish directory:** `web-build`

**Why these settings?** 
- `npm run build:web` runs `expo export:web` to build your app
- `web-build` is where Expo puts the built files
- Node 18 is the recommended version for Expo

---

### **Step 4: Add Environment Variables**

Your app needs your API keys to work. Let's add them:

1. In your Netlify site dashboard, go to **"Site settings"**
2. Click **"Environment variables"** in the left sidebar
3. Click **"Add variable"** and add these one by one:

```
EXPO_PUBLIC_SUPABASE_URL = your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY = your_openai_api_key
```

**Where to find these?**
- **Supabase keys**: Go to your Supabase project → Settings → API
- **OpenAI key**: From your `.env` file in the project

**Why?** These are secret keys that shouldn't be in your code. Netlify keeps them safe and injects them when your app runs.

---

### **Step 5: Deploy!**

1. Click **"Deploy site"** (or it may auto-deploy)
2. Watch the build logs - you'll see:
   - ✅ Installing dependencies
   - ✅ Building web version with Expo
   - ✅ Deploying to CDN
3. Wait 2-3 minutes for the first build

**What to look for in logs:**
- ✅ `Installing dependencies...` - Good!
- ✅ `Bundle complete` - Good!
- ✅ `Site is live at...` - Perfect!
- ❌ `Error:...` - Something went wrong (see troubleshooting below)

---

### **Step 6: Get Your Live URL**

1. Once deployed, you'll see a URL like: `stridecoach-123456.netlify.app`
2. Click it to open your live app! 🎉
3. You can also click **"Open production deploy"** in the dashboard

---

## Testing Your Deployment

Visit your Netlify URL and try:

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
3. Push to GitHub (Netlify will auto-redeploy)

---

### ❌ **App Loads but Shows Blank Screen**

**Problem:** Environment variables not set

**Fix:**
1. Go to Netlify dashboard → Site settings → Environment variables
2. Double-check all three environment variables are there
3. Click "Trigger deploy" to rebuild with new variables

---

### ❌ **Build Succeeds but App Won't Load**

**Problem:** Routing issue (common with single-page apps)

**Fix:** Already handled in our `netlify.toml` - the redirect rule sends all requests to `index.html`

---

## How Auto-Deployment Works

Once set up, Netlify is **completely automatic**:

1. You make changes to your code locally
2. You push to GitHub (`git push origin main`)
3. Netlify detects the change
4. Netlify automatically rebuilds and redeploys
5. Your live site updates in 2-3 minutes

**No manual steps needed!** 🚀

---

## Viewing Logs (When Something Goes Wrong)

1. Go to your Netlify site dashboard
2. Click on **"Deploys"** tab
3. Click on the latest deployment
4. Click **"View deploy log"**

You'll see everything your app is doing - errors, API calls, etc.

---

## Cost & Limits

Netlify gives you:
- **100GB bandwidth per month** (free)
- **300 build minutes per month** (free)
- **Unlimited sites** (free)
- **Custom domains** (free)

That's more than enough for development and even small production apps!

**When you're ready for production**, you can upgrade for $19/month for more bandwidth and features.

---

## Next Steps After Deployment

### ✅ **Web App is Live** - What about mobile?

Netlify hosts your **web version**. For mobile apps (iOS/Android):

1. **Option A:** Use **Expo Go** app (easiest for testing)
2. **Option B:** Build standalone apps with **EAS Build** (for app stores)

We can set this up separately once your web app is working!

---

## Need Help?

If something goes wrong:

1. **Check the deploy logs** in Netlify dashboard
2. **Copy the error message** and share it with me
3. I'll help you fix it step by step!

---

**Ready to deploy? Let's push these changes to GitHub first!**
