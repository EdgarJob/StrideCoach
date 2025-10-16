import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your StrideCoach AI assistant. I'm here to help you with your fitness journey. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate AI response (we'll replace this with real AI later)
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "That's a great question! Based on your current progress, I'd recommend focusing on consistency. Remember, small steps lead to big results! 🚶‍♂️",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const quickQuestions = [
    "How am I doing this week?",
    "Should I rest today?",
    "What's my next workout?",
    "Any tips for motivation?"
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Messages */}
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userText : styles.aiText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  message.isUser ? styles.userTimestamp : styles.aiTimestamp,
                ]}
              >
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Questions */}
      <View style={styles.quickQuestions}>
        <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickQuestionButton}
              onPress={() => setInputText(question)}
            >
              <Text style={styles.quickQuestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your AI coach anything..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            inputText.trim() === '' && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={inputText.trim() === ''}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() === '' ? '#9CA3AF' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#E0E7FF',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  quickQuestions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});
