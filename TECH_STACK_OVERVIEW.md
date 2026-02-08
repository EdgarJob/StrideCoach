# 🛠️ STRIDECOACH - COMPLETE TECH STACK OVERVIEW

## 📱 **FRONTEND (Mobile & Web App)**

### **Core Framework**
- **React Native** `0.81.5` - Mobile app framework (iOS, Android, Web)
- **React** `19.1.0` - UI library
- **Expo** `~54.0.31` - Development platform & build tool
  - **What it does:** Lets you build iOS/Android/Web apps with one codebase
  - **Why:** Faster development, no need for Xcode/Android Studio setup

### **Navigation**
- **React Navigation** `^7.1.18` - Screen navigation
  - `@react-navigation/native` - Core navigation library
  - `@react-navigation/bottom-tabs` `^7.4.9` - Bottom tab bar
  - `@react-navigation/stack` `^7.4.10` - Stack navigation
  - **What it does:** Handles moving between screens (Home, Plans, Progress, etc.)
  - **Why:** Industry standard, smooth animations, deep linking support

### **UI Components & Icons**
- **@expo/vector-icons** `^15.0.3` - Icon library (Ionicons)
- **expo-linear-gradient** `~15.0.8` - Gradient backgrounds
- **expo-status-bar** `~3.0.9` - Status bar styling
- **react-native-svg** `15.12.1` - SVG graphics support
- **react-native-safe-area-context** `~5.6.0` - Safe area handling (notches, etc.)
- **react-native-screens** `~4.16.0` - Native screen components

### **State Management**
- **React Context API** - Built-in React state management
  - `AuthContext` - User authentication state
  - `PlanContext` - Workout plan state
  - `AICoachContext` - AI chat state
  - **What it does:** Shares data across all screens without prop drilling
  - **Why:** Simple, no extra libraries needed, perfect for this app size

### **Offline Storage**
- **@react-native-async-storage/async-storage** `^2.2.0` - Local data storage
  - **What it does:** Stores data on device (like cookies in browser)
  - **Why:** Works offline, faster app loading, reduces API calls

### **Web Support**
- **react-native-web** `^0.21.0` - Run React Native on web
- **react-dom** `19.1.0` - React for web
- **serve** `^14.2.1` - Web server for production

---

## 🔐 **BACKEND & DATABASE**

### **Backend-as-a-Service (BaaS)**
- **Supabase** - Open-source Firebase alternative
  - **What it does:** Provides database, authentication, and serverless functions
  - **Why:** Fast setup, PostgreSQL database, built-in auth, free tier

### **Database**
- **PostgreSQL** (via Supabase) - Relational database
  - **Tables:**
    - `profiles` - User profile data
    - `workout_plans` - Generated workout plans
    - `workout_sessions` - Completed workout sessions
    - `health_daily` - Daily health metrics
    - `measurements` - Body measurements
    - `ai_events` - AI API usage tracking
  - **Security:** Row-Level Security (RLS) enabled on all tables
  - **What it does:** Stores all app data securely
  - **Why:** Reliable, scalable, SQL queries, relationships between data

### **Authentication**
- **Supabase Auth** (via `@supabase/supabase-js`)
  - Email/password authentication
  - JWT tokens for secure API calls
  - **What it does:** Handles user signup, login, logout
  - **Why:** Built-in, secure, no backend code needed

### **Client Library**
- **@supabase/supabase-js** `^2.75.0` - JavaScript client for Supabase
  - **What it does:** Connects your app to Supabase services
  - **Why:** Official library, handles auth, database queries, real-time updates

---

## 🤖 **AI & MACHINE LEARNING**

### **AI Provider**
- **OpenAI GPT-4o-mini** - Large Language Model
  - **What it does:** Generates workout plans, answers fitness questions, creates motivation messages
  - **Why:** Best quality AI responses, cost-effective (mini model), reliable API

### **AI Integration**
- **OpenAI API** (via Supabase Edge Functions)
  - **What it does:** Secure server-side AI calls
  - **Why:** API key never exposed to client, rate limiting, cost tracking

### **Client Library (Legacy)**
- **openai** `^6.3.0` - OpenAI SDK (not used anymore, kept for reference)
  - **Status:** Replaced by Edge Functions for security

---

## ⚡ **SERVERLESS FUNCTIONS (Edge Functions)**

### **Runtime**
- **Deno** `2.6.4` - Modern JavaScript/TypeScript runtime
  - **What it does:** Runs serverless functions in Supabase cloud
  - **Why:** Secure by default, TypeScript support, fast startup

### **Edge Functions (3 total)**
1. **`generate-plan`** - Creates personalized workout plans
2. **`chat-coach`** - Handles AI coach conversations
3. **`daily-motivation`** - Generates daily motivation messages

### **Technologies Used**
- **TypeScript** - Type-safe code
- **Deno Standard Library** `@0.208.0` - HTTP server utilities
- **Supabase JS Client** (via ESM) - Database access
- **OpenAI API** - AI calls

### **Features**
- ✅ JWT authentication required
- ✅ Rate limiting (50 requests/day per user)
- ✅ Usage tracking & cost monitoring
- ✅ Retry logic with exponential backoff
- ✅ CORS support for web app

---

## 🛠️ **DEVELOPMENT TOOLS**

### **Build Tools**
- **Babel** `^7.20.0` - JavaScript compiler
  - **babel-preset-expo** `~54.0.9` - Expo-specific Babel config
  - **What it does:** Converts modern JavaScript to compatible code
  - **Why:** Ensures code works on all devices

### **Type Checking**
- **TypeScript** `~5.9.2` - Type-safe JavaScript
  - **@types/react** `~19.1.10` - React type definitions
  - **What it does:** Catches errors before runtime
  - **Why:** Better code quality, IDE autocomplete

### **Environment Variables**
- **dotenv** `^17.2.3` - Environment variable management
  - **What it does:** Loads `.env` files securely
  - **Why:** Keeps secrets out of code

---

## 🚀 **DEPLOYMENT & HOSTING**

### **Web Hosting**
- **Netlify** - Static site hosting
  - **What it does:** Hosts your web app at a public URL
  - **Why:** Free tier, automatic deployments, fast CDN

### **Configuration**
- **netlify.toml** - Deployment settings
  - Build command: `npm run build:web`
  - Publish directory: `dist`
  - SPA routing support

### **Mobile Deployment**
- **Expo EAS Build** (not yet configured)
  - **What it does:** Builds iOS/Android apps
  - **Why:** No need for Xcode/Android Studio

---

## 📦 **PROJECT STRUCTURE**

```
StrideCoach/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CircularProgress.js
│   │   ├── WorkoutBuilder.js
│   │   └── WorkoutCalendar.js
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.js
│   │   ├── PlanContext.js
│   │   └── AICoachContext.js
│   ├── screens/            # App screens
│   │   ├── HomeScreen.js
│   │   ├── PlansScreen.js
│   │   ├── ProgressScreen.js
│   │   ├── ChatScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── PreferencesScreen.js
│   │   └── AuthScreen.js
│   └── services/           # Business logic
│       ├── supabase.js     # Database & auth
│       ├── aiService.js    # AI API calls
│       ├── planService.js  # Workout plan logic
│       └── cacheService.js # Offline storage
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── generate-plan/
│   │   ├── chat-coach/
│   │   ├── daily-motivation/
│   │   └── deno.json
│   └── migrations/        # Database migrations
│       └── 002_rls_and_rate_limiting.sql
├── App.js                 # Main app component
├── package.json          # Dependencies
└── app.json              # Expo configuration
```

---

## 🔄 **DATA FLOW (How Everything Connects)**

### **1. User Opens App**
```
User → React Native App → AuthContext → Supabase Auth → Check Login
```

### **2. Generate Workout Plan**
```
User → HomeScreen → PlanContext → planService → aiService → 
Supabase Edge Function (generate-plan) → OpenAI API → 
Response → Supabase Database → Cache → Display to User
```

### **3. Chat with AI Coach**
```
User → ChatScreen → AICoachContext → aiService → 
Supabase Edge Function (chat-coach) → OpenAI API → 
Response → Display Message
```

### **4. Offline Access**
```
User Opens App → cacheService → AsyncStorage → 
Display Cached Data → Background Refresh → Supabase API
```

---

## 🎯 **KEY ARCHITECTURAL DECISIONS**

### **Why React Native + Expo?**
- ✅ One codebase for iOS, Android, and Web
- ✅ Fast development with hot reload
- ✅ No native code needed (mostly)
- ✅ Large community and libraries

### **Why Supabase?**
- ✅ PostgreSQL database (powerful, relational)
- ✅ Built-in authentication
- ✅ Row-Level Security (RLS) for data protection
- ✅ Edge Functions for serverless backend
- ✅ Free tier for development

### **Why Edge Functions (Deno)?**
- ✅ Security: API keys never exposed to client
- ✅ Rate limiting prevents abuse
- ✅ Cost tracking and monitoring
- ✅ TypeScript support
- ✅ Fast cold starts

### **Why AsyncStorage for Caching?**
- ✅ Works offline
- ✅ Instant app loading
- ✅ Reduces API calls (saves money)
- ✅ Better user experience

---

## 📊 **TECHNOLOGY SUMMARY TABLE**

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend Framework** | React Native | 0.81.5 | Mobile app UI |
| **UI Library** | React | 19.1.0 | Component library |
| **Platform** | Expo | 54.0.31 | Development & build |
| **Navigation** | React Navigation | 7.x | Screen routing |
| **Database** | PostgreSQL (Supabase) | Latest | Data storage |
| **Backend** | Supabase | Latest | BaaS platform |
| **Auth** | Supabase Auth | Latest | User authentication |
| **Serverless** | Deno | 2.6.4 | Edge Functions runtime |
| **AI** | OpenAI GPT-4o-mini | Latest | Workout generation |
| **Storage** | AsyncStorage | 2.2.0 | Offline cache |
| **Web Hosting** | Netlify | Latest | Production hosting |
| **Language** | JavaScript/TypeScript | ES2020+ | Code |

---

## 🎓 **LEARNING POINTS**

### **What You've Learned:**
1. **React Native** - Building cross-platform mobile apps
2. **Context API** - Managing global app state
3. **Supabase** - Backend-as-a-Service platform
4. **PostgreSQL** - Relational database design
5. **Deno** - Modern serverless runtime
6. **Edge Functions** - Serverless backend code
7. **OpenAI API** - Integrating AI into apps
8. **Offline Caching** - AsyncStorage and cache strategies
9. **JWT Authentication** - Secure API calls
10. **Rate Limiting** - Cost control and abuse prevention

### **Best Practices You're Using:**
- ✅ Environment variables for secrets
- ✅ Row-Level Security for data protection
- ✅ Server-side API key storage
- ✅ Error handling and retry logic
- ✅ Offline-first architecture
- ✅ TypeScript for type safety
- ✅ Code organization (services, contexts, screens)

---

## 🚦 **CURRENT STATUS**

### **✅ Completed:**
- Frontend app (all screens and components)
- Supabase database setup
- Authentication system
- Edge Functions code (3 functions)
- Offline caching system
- Security hardening (RLS, rate limiting)

### **⚠️ Needs Deployment:**
- Edge Functions (need to deploy to Supabase)
- OpenAI API key (need to set as secret)

### **📝 Future Enhancements:**
- Unit testing (Jest + React Native Testing Library)
- Error logging (Sentry)
- CI/CD pipeline (GitHub Actions)
- Mobile app builds (Expo EAS)

---

## 📚 **RESOURCES**

- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Supabase Docs:** https://supabase.com/docs
- **Deno Docs:** https://deno.land/docs
- **OpenAI API Docs:** https://platform.openai.com/docs
- **React Navigation Docs:** https://reactnavigation.org

---

**Last Updated:** January 15, 2026  
**Project Status:** Development (zero-draft branch)  
**Next Step:** Deploy Edge Functions to Supabase
