# 🚀 OAuth Quick Start Guide

Your OAuth buttons are ready! Follow these steps to make them work.

## ✅ What You Need

1. **Google Account** (for Google sign-in)
2. **Apple Developer Account** ($99/year) (for Apple sign-in)
3. **Supabase Project** (you already have this)

---

## 📋 Quick Setup Checklist

### **STEP 1: Find Your Supabase Callback URL**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your StrideCoach project
3. Go to **Authentication** → **URL Configuration**
4. Copy your **Site URL** - it looks like:
   ```
   https://abcdefghijklmn.supabase.co
   ```
5. Your **Callback URL** is:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   (Replace YOUR-PROJECT-REF with your actual project reference)

---

## 🔵 Enable Google Sign-In (15 minutes)

### Part A: Google Cloud Console

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Create/Select Project**:
   - Click project dropdown at top
   - Click "New Project"
   - Name: "StrideCoach"
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click it and press "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External**
   - Click "Create"
   - Fill in:
     - App name: `StrideCoach`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Skip (click "Save and Continue")
   - Click "Back to Dashboard"

5. **Create OAuth Client ID**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: `StrideCoach Web Client`
   - **Authorized JavaScript origins**:
     ```
     https://YOUR-PROJECT-REF.supabase.co
     http://localhost:8081
     ```
   - **Authorized redirect URIs**:
     ```
     https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     http://localhost:8081/auth/v1/callback
     ```
   - Click "Create"
   - **COPY** the Client ID and Client Secret

### Part B: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your StrideCoach project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. Paste your **Client ID**
7. Paste your **Client Secret**
8. Click **Save**

### Part C: Test It!

1. Refresh your StrideCoach app
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in! 🎉

---

## 🍎 Enable Apple Sign-In (30 minutes)

**⚠️ Requirements**: 
- Apple Developer Account ($99/year)
- If you don't have one, skip Apple for now and just use Google

### Part A: Apple Developer Portal

1. **Go to**: [Apple Developer Portal](https://developer.apple.com/)

2. **Create App ID**:
   - Go to "Certificates, Identifiers & Profiles"
   - Click "Identifiers" → "+" button
   - Select "App IDs" → "Continue"
   - Select "App" → "Continue"
   - Fill in:
     - Description: `StrideCoach`
     - Bundle ID: `com.yourname.stridecoach` (use your actual name)
     - Capabilities: Check **"Sign in with Apple"**
   - Click "Continue" → "Register"

3. **Create Services ID** (This is your Client ID):
   - Click "Identifiers" → "+" button
   - Select "Services IDs" → "Continue"
   - Fill in:
     - Description: `StrideCoach Web`
     - Identifier: `com.yourname.stridecoach.web`
   - Check **"Sign in with Apple"**
   - Click "Configure"
   - Primary App ID: Select the App ID you created
   - Web Domain: `YOUR-PROJECT-REF.supabase.co`
   - Return URLs: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Click "Save" → "Continue" → "Register"
   - **COPY** this Services ID (com.yourname.stridecoach.web)

4. **Create Key**:
   - Click "Keys" → "+" button
   - Key Name: `StrideCoach Sign In Key`
   - Check **"Sign in with Apple"**
   - Click "Configure"
   - Primary App ID: Select your App ID
   - Click "Save" → "Continue" → "Register"
   - **DOWNLOAD** the .p8 key file
   - **COPY** the Key ID (10 characters, like `ABC123DEFG`)
   - **COPY** your Team ID (found in top right of developer portal)

### Part B: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your StrideCoach project
3. Go to **Authentication** → **Providers**
4. Find **Apple** in the list
5. Toggle it **ON**
6. Fill in:
   - **Services ID**: `com.yourname.stridecoach.web` (from step 3)
   - **Team ID**: Your team ID (10 characters)
   - **Key ID**: Your key ID (10 characters)
   - **Secret Key**: Open the .p8 file in a text editor, copy ALL the content including the BEGIN/END lines
7. Click **Save**

### Part C: Test It!

1. Refresh your StrideCoach app
2. Click "Continue with Apple"
3. Sign in with your Apple ID
4. You should be redirected back and logged in! 🎉

---

## 🌐 Update Redirect URLs

**Important**: Add your local development URL to allowed redirects:

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:8081
   http://localhost:8081/*
   http://localhost:19006
   http://localhost:19006/*
   ```
3. Click **Save**

---

## 🧪 Testing

### Test Google Sign-In:
1. Open your app: `http://localhost:8081`
2. Click "Continue with Google"
3. Select your Google account
4. **Expected**: You're redirected back and logged in
5. **Check**: Supabase Dashboard → Authentication → Users (new user should appear)

### Test Apple Sign-In:
1. Open your app: `http://localhost:8081`
2. Click "Continue with Apple"
3. Sign in with your Apple ID
4. **Expected**: You're redirected back and logged in
5. **Check**: Supabase Dashboard → Authentication → Users (new user should appear)

---

## 🆘 Troubleshooting

### Google Issues:

**"redirect_uri_mismatch"**:
- Check that redirect URIs in Google Cloud Console **exactly match** Supabase callback URL
- Make sure there are no trailing slashes

**"Access blocked: This app's request is invalid"**:
- Go back to OAuth consent screen
- Add your email as a test user
- OR publish the app (only for production)

**Nothing happens when clicking button**:
- Open browser console (F12)
- Look for error messages
- Check Supabase logs

### Apple Issues:

**"invalid_client"**:
- Verify Services ID is correct
- Check that it's configured for Sign in with Apple

**"invalid_request"**:
- Check Web Domain in Services ID configuration
- Ensure Return URLs are correct

### General Issues:

**Popup blocked**:
- Check browser popup blocker
- Allow popups for localhost

**Redirect loop**:
- Clear browser cookies
- Check redirect URLs in Supabase

**"User not found" after sign-in**:
- Check Supabase Dashboard → Logs
- Profile creation may have failed
- Check browser console for errors

---

## 📝 Quick Checklist

- [ ] Supabase callback URL copied
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Google Client ID created
- [ ] Google credentials added to Supabase
- [ ] Tested Google sign-in
- [ ] (Optional) Apple Developer account ready
- [ ] (Optional) Apple App ID created
- [ ] (Optional) Apple Services ID created
- [ ] (Optional) Apple Key created
- [ ] (Optional) Apple credentials added to Supabase
- [ ] (Optional) Tested Apple sign-in
- [ ] Redirect URLs updated in Supabase

---

## 🎯 Recommendation

**Start with Google only!** It's:
- ✅ Free
- ✅ Easier to set up
- ✅ Widely used
- ✅ No yearly fees

**Add Apple later** when:
- You have an Apple Developer account
- You're ready to publish to App Store
- You want to target iOS users specifically

---

## 📚 Need More Help?

- Full detailed guide: See `OAUTH_SETUP.md`
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Ready to get started? Begin with Google! It only takes 15 minutes! 🚀**

