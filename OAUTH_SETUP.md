# OAuth Setup Guide for StrideCoach

This guide explains how to enable Google and Apple sign-in for your StrideCoach app using Supabase.

## ✅ What's Already Done

The code for Google and Apple sign-in has been added to the app:
- OAuth sign-in function in `AuthContext.js`
- Google and Apple buttons in `AuthScreen.js`
- Beautiful UI with branded buttons

## 🔧 Supabase Configuration Required

To enable OAuth providers, you need to configure them in your Supabase dashboard:

### 1. Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your StrideCoach project
3. Navigate to **Authentication** → **Providers**

---

## 🔵 Google OAuth Setup

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Configure OAuth consent screen if not done:
   - User Type: External
   - App name: StrideCoach
   - User support email: Your email
   - Developer contact: Your email
7. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: StrideCoach Web
   - Authorized JavaScript origins:
     ```
     https://your-supabase-project-ref.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://your-supabase-project-ref.supabase.co/auth/v1/callback
     ```
8. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. In Supabase Dashboard → Authentication → Providers
2. Find **Google** and click **Enable**
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **Save**

---

## 🍎 Apple OAuth Setup

### Step 1: Get Apple OAuth Credentials

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Go to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** → **+** → **App IDs**
5. Configure:
   - Description: StrideCoach
   - Bundle ID: com.yourcompany.stridecoach
   - Enable **Sign in with Apple**
6. Create a **Services ID**:
   - Description: StrideCoach Web
   - Identifier: com.yourcompany.stridecoach.web
   - Enable **Sign in with Apple**
   - Configure:
     - Primary App ID: Select your App ID
     - Website URLs:
       - Domains: `your-supabase-project-ref.supabase.co`
       - Return URLs: `https://your-supabase-project-ref.supabase.co/auth/v1/callback`
7. Create a **Key**:
   - Key Name: StrideCoach Apple Sign In Key
   - Enable **Sign in with Apple**
   - Configure: Select your Primary App ID
   - Download the key file (.p8)
8. Note down:
   - Services ID (Client ID)
   - Team ID
   - Key ID
   - Key file content

### Step 2: Configure in Supabase

1. In Supabase Dashboard → Authentication → Providers
2. Find **Apple** and click **Enable**
3. Paste your **Services ID** (Client ID)
4. Paste your **Team ID**
5. Paste your **Key ID**
6. Paste the content of your **.p8 key file**
7. Click **Save**

---

## 🌐 Update Redirect URLs

After enabling the providers, you need to add your app's URL to allowed redirect URLs:

1. In Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   ```
   http://localhost:8081
   http://localhost:19006
   https://your-production-domain.com
   ```

---

## 🧪 Testing OAuth

1. **Development**: 
   - Run your app: `npm start`
   - Open `http://localhost:8081`
   - Go to sign-in page
   - Click "Continue with Google" or "Continue with Apple"

2. **Expected Flow**:
   - User clicks OAuth button
   - Redirected to Google/Apple login page
   - User grants permission
   - Redirected back to your app
   - User is automatically signed in
   - Profile is created if it's their first time

3. **Debug**:
   - Check browser console for errors
   - Check Supabase Dashboard → Authentication → Users to see if user was created
   - Check Supabase Dashboard → Logs for authentication events

---

## 🔒 Security Notes

1. **Never commit OAuth credentials** to version control
2. **Use environment variables** for sensitive data in production
3. **Enable RLS** (Row Level Security) on your Supabase tables
4. **Validate redirect URLs** to prevent open redirect vulnerabilities
5. **Monitor authentication logs** in Supabase Dashboard

---

## 📱 Production Deployment

When deploying to production:

1. Update OAuth redirect URLs with production domain
2. Update Supabase allowed redirect URLs
3. Test OAuth flow on production
4. Monitor for any authentication errors

---

## 🆘 Troubleshooting

### Google OAuth Issues

- **"redirect_uri_mismatch"**: Check that redirect URI in Google Cloud Console matches exactly with Supabase callback URL
- **"Access blocked"**: Configure OAuth consent screen and add test users
- **No response**: Check browser console and Supabase logs

### Apple OAuth Issues

- **"invalid_client"**: Verify Services ID and Key ID are correct
- **"invalid_grant"**: Check that .p8 key file content is correctly pasted
- **Redirect fails**: Ensure domains and return URLs are configured correctly in Apple Developer Portal

### General OAuth Issues

- **Popup blocked**: Check browser popup settings
- **Infinite redirect loop**: Clear browser cache and cookies
- **"User not found"**: Profile creation may have failed, check Supabase logs

---

## 📚 Additional Resources

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Guide](https://developer.apple.com/sign-in-with-apple/)

---

## ✨ Features

- ✅ One-click sign in with Google
- ✅ One-click sign in with Apple
- ✅ Automatic profile creation for OAuth users
- ✅ Secure token handling
- ✅ Beautiful branded UI
- ✅ Mobile-friendly design
- ✅ Error handling with user-friendly messages

---

Need help? Check the Supabase documentation or reach out to support!

