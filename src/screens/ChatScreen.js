import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAICoach } from '../contexts/AICoachContext';
import colors from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { 
    isLoading, 
    conversationHistory, 
    sendMessage: sendAIMessage, 
    clearConversation,
    pendingPlanAction,
    isApplyingPlanAction,
    confirmPendingPlanAction,
    dismissPendingPlanAction
  } = useAICoach();
  
  const [inputText, setInputText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollViewRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [conversationHistory]);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    await sendAIMessage(messageText);
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setShowClearConfirm(false);
    clearConversation();
  };

  const handleConfirmPlanAction = async () => {
    await confirmPendingPlanAction();
  };

  const quickQuestions = [
    "How am I doing this week?",
    "Should I rest today?",
    "What's my next workout?",
    "Any tips for motivation?"
  ];

  const renderMessage = (msg) => (
    <View key={msg.id} style={[
      styles.messageContainer,
      msg.role === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        msg.role === 'user' ? styles.userBubble : styles.aiBubble,
        msg.isError && styles.errorBubble
      ]}>
        <Text style={[
          styles.messageText,
          msg.role === 'user' ? styles.userText : styles.aiText,
          msg.isError && styles.errorText
        ]}>
          {msg.content}
        </Text>
        <Text style={styles.timestamp}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Coach</Text>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color={colors.textMedium} />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>


      {/* Chat Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {conversationHistory.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Ionicons name="chatbubbles" size={48} color={colors.primary} />
            <Text style={styles.welcomeTitle}>Welcome to your AI Coach!</Text>
            <Text style={styles.welcomeSubtitle}>
              I'm here to help you with your fitness journey. Ask me about workouts, 
              nutrition, motivation, or anything fitness-related!
            </Text>
            <View style={styles.suggestionChips}>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => setInputText(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          conversationHistory.map(renderMessage)
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI Coach is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Pending plan update confirmation */}
      {pendingPlanAction && (
        <View style={styles.planActionContainer}>
          <Text style={styles.planActionTitle}>Plan Update Proposal</Text>
          <Text style={styles.planActionMessage}>
            {pendingPlanAction.confirmationPrompt || 'Apply these workout plan updates?'}
          </Text>
          {pendingPlanAction.summary ? (
            <Text style={styles.planActionSummary}>{pendingPlanAction.summary}</Text>
          ) : null}
          {pendingPlanAction.dayPreview ? (
            <View style={styles.planActionPreview}>
              <Text style={styles.planActionPreviewTitle}>Workout Days Change</Text>
              <Text style={styles.planActionPreviewText}>
                Current ({pendingPlanAction.dayPreview.currentCount}): {pendingPlanAction.dayPreview.currentDays.join(', ') || 'None'}
              </Text>
              <Text style={styles.planActionPreviewText}>
                Proposed ({pendingPlanAction.dayPreview.proposedCount}): {pendingPlanAction.dayPreview.proposedDays.join(', ') || 'None'}
              </Text>
              {pendingPlanAction.dayPreview.proposedCount < (pendingPlanAction.dayPreview.currentCount - 2) ? (
                <Text style={styles.planActionWarningText}>
                  Large reduction detected. This will be safety-adjusted unless you explicitly ask for fewer days.
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={styles.planActionButtons}>
            <TouchableOpacity
              style={styles.planActionDismissButton}
              onPress={dismissPendingPlanAction}
              disabled={isApplyingPlanAction || isLoading}
            >
              <Text style={styles.planActionDismissText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.planActionConfirmButton}
              onPress={handleConfirmPlanAction}
              disabled={isApplyingPlanAction || isLoading}
            >
              {isApplyingPlanAction ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.planActionConfirmText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your AI coach anything..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          editable={!isLoading && !isApplyingPlanAction}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' || isLoading || isApplyingPlanAction) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={inputText.trim() === '' || isLoading || isApplyingPlanAction}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={(inputText.trim() === '' || isLoading || isApplyingPlanAction) ? colors.textLight : colors.white}
          />
        </TouchableOpacity>
      </View>
      {/* Clear Chat Confirmation */}
      {showClearConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Clear Chat</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to clear the conversation?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancelButton} onPress={() => setShowClearConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmClearButton} onPress={confirmClearChat}>
                <Text style={styles.confirmClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textMedium,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textMedium,
  },
  planActionContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  planActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planActionMessage: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
    marginBottom: 4,
  },
  planActionSummary: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 10,
  },
  planActionPreview: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  planActionPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  planActionPreviewText: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 2,
  },
  planActionWarningText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  planActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  planActionDismissButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.borderLight,
  },
  planActionDismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  planActionConfirmButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  planActionConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
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
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      web: { boxShadow: `0 1px 2px ${colors.shadow}` },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    }),
    elevation: 2,
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.textDark,
  },
  errorText: {
    color: '#DC2626',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: colors.textDark,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  confirmDialog: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  confirmClearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmClearText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
