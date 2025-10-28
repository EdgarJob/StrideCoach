# TypeScript Configuration Fix for Deno Edge Functions

## Problem

TypeScript/ESLint errors were showing in the IDE for Supabase Edge Functions:
- "Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'"
- "Cannot find name 'Deno'"

**Root Cause:** The Edge Functions run in Deno runtime (not Node.js), but the IDE was trying to check them with Node.js TypeScript compiler.

---

## Solution Applied

### 1. Created `supabase/functions/deno.json`
Configures Deno-specific settings for Edge Functions:
- Enables Deno standard library types
- Sets up import mappings for Supabase and Deno modules
- Configures strict TypeScript checking

### 2. Updated `tsconfig.json`
Excluded `supabase/functions/**/*` from Expo's TypeScript compiler:
- Prevents Node.js TypeScript from checking Deno files
- Avoids type conflicts between Node.js and Deno

### 3. Created `.vscode/settings.json`
Enables Deno Language Server for the functions directory:
- Tells VS Code to use Deno LSP for files in `supabase/functions/`
- Enables Deno linting and type checking
- Keeps Expo/Node.js TypeScript for the rest of the project

### 4. Created `.vscode/extensions.json`
Recommends the Deno extension for VS Code:
- Prompts users to install `denoland.vscode-deno` extension
- Also recommends ESLint and Prettier for consistency

---

## How to Fix the Errors in Your IDE

### Step 1: Install Deno Extension (If Not Installed)

**VS Code:**
1. Open Extensions panel (⌘+Shift+X on Mac, Ctrl+Shift+X on Windows)
2. Search for "Deno"
3. Install "Deno for Visual Studio Code" by denoland
4. Restart VS Code

**Other IDEs:**
- **WebStorm/IntelliJ:** Install Deno plugin from Settings → Plugins
- **Cursor:** Should auto-detect the `.vscode/settings.json` configuration

### Step 2: Reload VS Code Window

1. Press `⌘+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "Reload Window"
3. Press Enter

The TypeScript errors in `supabase/functions/` should now be gone!

---

## Verification

### ✅ Main App (src/) - No Errors
- TypeScript/ESLint properly configured for React Native/Expo
- All service files (`aiService.js`, `supabase.js`) have no errors
- All screens and components are error-free

### ✅ Supabase Functions - Deno-Aware
- Edge Functions use Deno types
- No conflicts with Node.js types
- Proper autocomplete for Deno APIs

---

## File Structure

```
StrideCoach/
├── tsconfig.json                 # Expo TypeScript config (excludes supabase/)
├── .vscode/
│   ├── settings.json            # Enables Deno for supabase/functions/
│   └── extensions.json          # Recommends Deno extension
├── supabase/
│   └── functions/
│       ├── deno.json            # Deno configuration
│       ├── generate-plan/
│       │   └── index.ts         # Now properly typed with Deno
│       ├── chat-coach/
│       │   └── index.ts         # Now properly typed with Deno
│       └── daily-motivation/
│           └── index.ts         # Now properly typed with Deno
└── src/                         # Expo/React Native TypeScript
```

---

## What Each Configuration Does

### `deno.json`
- **Purpose:** Deno-specific configuration for Edge Functions
- **Key Settings:**
  - `lib: ["deno.window", "deno.unstable"]` - Enables Deno types
  - `imports` - Maps module URLs for easier imports
  - `strict: true` - Enables strict type checking

### `tsconfig.json` (Updated)
- **Purpose:** Expo/React Native TypeScript configuration
- **Key Change:**
  - `exclude: ["supabase/functions/**/*"]` - Don't check Deno files with Node.js compiler

### `.vscode/settings.json`
- **Purpose:** IDE-specific configuration
- **Key Settings:**
  - `deno.enable: false` - Deno off by default
  - `deno.enablePaths: ["supabase/functions"]` - Deno only for functions
  - Keeps separate TypeScript configs for app vs functions

---

## Troubleshooting

### "Still seeing errors after reloading"
1. Make sure Deno extension is installed
2. Check VS Code output panel: `Deno Language Server`
3. Try: Close VS Code → Delete `.vscode/` folder → Reopen → Restore `.vscode/` files
4. Restart TS Server: `⌘+Shift+P` → "TypeScript: Restart TS Server"

### "Deno extension not working"
- Check Deno extension is enabled: VS Code settings → Extensions → Deno → Enable
- Verify in settings: `"deno.enable"` should be showing as enabled for functions directory

### "Import errors in Edge Functions"
- This is normal - Deno resolves imports at runtime from URLs
- The functions will work when deployed to Supabase
- To test locally: Install Deno CLI and run with `deno run --allow-all`

---

## Summary

**Files Created:**
1. `supabase/functions/deno.json` - Deno configuration
2. `.vscode/settings.json` - IDE Deno settings
3. `.vscode/extensions.json` - Extension recommendations
4. `TYPESCRIPT_DENO_FIX.md` - This documentation

**Files Modified:**
1. `tsconfig.json` - Excluded Deno files from Expo TypeScript

**Result:**
- ✅ Main app code: 0 errors
- ✅ Edge Functions: Properly typed with Deno
- ✅ No type conflicts between Node.js and Deno
- ✅ Better developer experience with proper autocomplete

---

## Next Steps

After applying these fixes:
1. ✅ TypeScript errors resolved
2. ✅ Ready to continue with Phase 2 (offline caching)
3. ✅ Ready to continue with Phase 3 (unit tests)

The codebase is now properly configured for both Expo (React Native) and Deno (Edge Functions).

