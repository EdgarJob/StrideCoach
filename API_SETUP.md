# API Key Setup

## Quick Setup for Testing

To enable the AI Coach functionality:

1. **Edit the AI Service file:**
   - Open `src/services/aiService.js`
   - Find line 5: `apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here',`
   - Replace `'your-openai-api-key-here'` with your actual OpenAI API key

2. **Your API Key:**
   ```
   [Your API key will be provided separately via secure message]
   ```

3. **Test the app:**
   - Run `npx expo start --web`
   - Navigate to the Chat tab
   - Try asking the AI Coach a question!

## Production Setup

For production, use environment variables:

1. Create a `.env` file in the root directory
2. Add: `EXPO_PUBLIC_OPENAI_API_KEY=your-api-key-here`
3. The app will automatically use the environment variable

## Security Note

⚠️ **Never commit API keys to version control!** Always use environment variables in production.
