// Simple test script to verify OpenAI API key is working
require('dotenv').config();
const OpenAI = require('openai');

async function testAPIKey() {
  console.log('🔑 Testing OpenAI API Key...');
  
  // Check if API key exists
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found in environment variables');
    console.log('Make sure EXPO_PUBLIC_OPENAI_API_KEY is set in your .env file');
    return;
  }
  
  if (apiKey === 'your-openai-api-key-here') {
    console.error('❌ API key is still the placeholder value');
    console.log('Please replace with your actual OpenAI API key in .env file');
    return;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Test with a simple completion
    console.log('🧪 Testing API call...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "API test successful" if you can read this message.'
        }
      ],
      max_tokens: 10
    });
    
    const result = response.choices[0].message.content;
    console.log('✅ API Response:', result);
    console.log('🎉 OpenAI API key is working correctly!');
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('🔑 Invalid API key - check your .env file');
    } else if (error.message.includes('429')) {
      console.log('💰 API quota exceeded - check your OpenAI account');
    } else if (error.message.includes('network')) {
      console.log('🌐 Network error - check your internet connection');
    } else {
      console.log('🐛 Unknown error - check the error details above');
    }
  }
}

// Run the test
testAPIKey();
