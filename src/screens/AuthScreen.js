import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';

export default function AuthScreen() {
  const passwordInputRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    age: '',
    height: '',
    weight: '',
    sex: 'male',
  });

  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text: string }

  const { signIn, signUp, signInWithOAuth } = useAuth();

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const syncAutofillField = (field, event) => {
    const nativeText = event?.nativeEvent?.text;
    if (typeof nativeText === 'string') {
      updateField(field, nativeText);
    }
  };

  // Auto-clear messages after 5 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showError = (text) => setMessage({ type: 'error', text });
  const showSuccess = (text) => setMessage({ type: 'success', text });

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        showError(error.message || 'Failed to sign in. Please try again.');
      }
    } catch (error) {
      showError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (!formData.email || !formData.password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!isLogin && (!formData.displayName || !formData.age || !formData.height || !formData.weight)) {
      showError('Please fill in all profile fields.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          showError(error.message || 'Invalid email or password.');
        }
      } else {
        const userData = {
          display_name: formData.displayName,
          sex: formData.sex,
          age: parseInt(formData.age),
          height_cm: parseInt(formData.height),
          weight_kg: parseFloat(formData.weight),
          goal: {
            type: 'weight_loss',
            target_weight: parseFloat(formData.weight) - 5,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '17:00',
            durations: {
              walk_min: 60,
              strength_min: 30,
            },
          },
          mode: 'walk_plus_strength',
          equipment: ['none'],
          consent: {
            health_data: true,
            ai_coaching: true,
            analytics: true,
          },
        };

        const { error } = await signUp(formData.email, formData.password, userData);
        if (error) {
          showError(error.message || 'Failed to create account.');
        } else {
          showSuccess('Account created! Please check your email to verify your account.');
        }
      }
    } catch (error) {
      showError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>StrideCoach</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back!' : 'Start your fitness journey'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Inline message banner */}
          {message && (
            <View style={[
              styles.messageBanner,
              message.type === 'error' ? styles.errorBanner : styles.successBanner
            ]}>
              <Ionicons
                name={message.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={20}
                color={message.type === 'error' ? colors.error : colors.success}
                style={styles.messageIcon}
              />
              <Text style={[
                styles.messageText,
                message.type === 'error' ? styles.errorText : styles.successText
              ]}>
                {message.text}
              </Text>
              <TouchableOpacity onPress={() => setMessage(null)}>
                <Ionicons name="close" size={18} color={colors.textMedium} />
              </TouchableOpacity>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={colors.textMedium} style={styles.inputIcon} />
            <TextInput
              key={`email-${isLogin ? 'login' : 'signup'}`}
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              onChange={(event) => syncAutofillField('email', event)}
              onEndEditing={(event) => syncAutofillField('email', event)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isLogin ? 'username' : 'emailAddress'}
              autoComplete={isLogin ? 'username' : 'email'}
              importantForAutofill="yes"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={colors.textMedium} style={styles.inputIcon} />
            <TextInput
              key={`password-${isLogin ? 'login' : 'signup'}`}
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              onChange={(event) => syncAutofillField('password', event)}
              onEndEditing={(event) => syncAutofillField('password', event)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType={isLogin ? 'password' : 'newPassword'}
              autoComplete={isLogin ? 'password' : 'new-password'}
              importantForAutofill="yes"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Profile fields for signup */}
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={colors.textMedium} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={formData.displayName}
                  onChangeText={(text) => updateField('displayName', text)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons name="calendar" size={20} color={colors.textMedium} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    value={formData.age}
                    onChangeText={(text) => updateField('age', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons name="male-female" size={20} color={colors.textMedium} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Sex (male/female)"
                    value={formData.sex}
                    onChangeText={(text) => updateField('sex', text)}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons name="resize" size={20} color={colors.textMedium} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Height (cm)"
                    value={formData.height}
                    onChangeText={(text) => updateField('height', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons name="fitness" size={20} color={colors.textMedium} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Weight (kg)"
                    value={formData.weight}
                    onChangeText={(text) => updateField('weight', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          {isLogin && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* OAuth Buttons */}
              <TouchableOpacity
                style={[styles.oauthButton, styles.googleButton]}
                onPress={() => handleOAuthSignIn('google')}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.oauthButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Toggle Login/Signup */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.toggleButtonText}>
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: `0 2px 8px ${colors.shadow}` },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    }),
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textDark,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  passwordToggle: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.inputBorder,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  googleButton: {
    borderColor: '#DB4437',
  },
  oauthButtonText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  messageIcon: {
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
  },
  successText: {
    color: colors.success,
  },
});
