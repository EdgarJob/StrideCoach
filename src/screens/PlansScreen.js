import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PreferencesScreen from './PreferencesScreen';
import WorkoutCalendar from '../components/WorkoutCalendar';
import CircularProgress from '../components/CircularProgress';
import PremiumBackground from '../components/PremiumBackground';

export default function PlansScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const {
    currentPlan,
    isLoading,
    error,
    generatePlan,
    getPlanProgress,
    getWeekProgress,
    isPlanCompleted
  } = usePlan();

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Check if user is truly new (just signed up) and hasn't seen onboarding
  useEffect(() => {
    if (!profile) return;

    const checkOnboarding = async () => {
      const onboardingKey = `onboarding_completed_${profile.id}`;
      const hasCompletedOnboarding = await AsyncStorage.getItem(onboardingKey);

      if (!hasCompletedOnboarding && !profile.workout_preferences) {
        setShowNewUserModal(true);
      }
    };

    checkOnboarding();
  }, [profile]);

  // Store user preferences for plan generation
  const [savedPreferences, setSavedPreferences] = useState({
    workoutTypes: {
      walking: true,
      strength: true,
      running: false,
      yoga: false,
      cycling: false,
      swimming: false,
    },
    availableDays: {
      monday: true,
      wednesday: true,
      friday: true,
      tuesday: false,
      thursday: false,
      saturday: false,
      sunday: false,
    },
    workoutDuration: 30,
    difficultyLevel: 'beginner',
    primaryGoal: 'general_fitness',
    hasEquipment: {
      none: true,
      dumbbells: false,
      resistance_bands: false,
      yoga_mat: false,
      treadmill: false,
      bike: false,
    }
  });

  const handleGeneratePlan = async (customPreferences = null) => {
    setIsGenerating(true);
    setShowGenerationModal(true);

    const preferences = customPreferences || savedPreferences;

    try {
      // Step 1: Preparing your preferences
      setGenerationStep('Preparing your workout preferences...');
      setGenerationProgress(5);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Analyzing your fitness goals
      setGenerationStep('Analyzing your fitness goals and requirements...');
      setGenerationProgress(12);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Processing your available days
      setGenerationStep('Processing your available workout days...');
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 4: Connecting to AI fitness coach...
      setGenerationStep('Connecting to AI fitness coach...');
      setGenerationProgress(30);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 5: Sending your preferences to AI model...
      setGenerationStep('Sending your preferences to AI model...');
      setGenerationProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 6: AI is analyzing your profile...
      setGenerationStep('AI is analyzing your profile and goals...');
      setGenerationProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 7: Drafting your personalized workouts...
      setGenerationStep('Drafting your personalized workouts...');
      setGenerationProgress(65);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 7.5: Adding variety to workouts...
      setGenerationStep('Adding variety and progression to workouts...');
      setGenerationProgress(70);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 8: Creating your 4-week plan structure...
      setGenerationStep('Creating your 4-week plan structure...');
      setGenerationProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 8.5: Optimizing workout timing...
      setGenerationStep('Optimizing workout timing and rest periods...');
      setGenerationProgress(85);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 9: Finalizing your fitness plan...
      setGenerationStep('Finalizing your fitness plan...');
      setGenerationProgress(90);
      const result = await generatePlan(preferences);
      
      if (result.success) {
        setGenerationStep('Saving your personalized plan...');
        setGenerationProgress(95);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setGenerationStep('Plan generated successfully! 🎉');
        setGenerationProgress(100);
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setShowGenerationModal(false);
        setStatusMessage({ type: 'success', text: 'Your personalized 4-week fitness plan has been created successfully!' });
        setTimeout(() => setStatusMessage(null), 5000);
        setShowPlanModal(true);
      } else {
        setShowGenerationModal(false);
        setStatusMessage({ type: 'error', text: `Failed to generate plan: ${result.error}` });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (error) {
      setShowGenerationModal(false);
      setStatusMessage({ type: 'error', text: `An error occurred while generating your plan: ${error.message}` });
      setTimeout(() => setStatusMessage(null), 5000);
    }
    
    setIsGenerating(false);
    setGenerationStep('');
    setGenerationProgress(0);
  };

  const handleSaveCustomPlan = (customPlan) => {
    setStatusMessage({ type: 'success', text: 'Your custom workout plan has been saved successfully!' });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handlePreferencesSaved = async (newPreferences) => {
    setSavedPreferences(newPreferences);
    setShowPreferences(false);

    if (showNewUserModal) {
      setShowNewUserModal(false);
      if (profile) {
        const onboardingKey = `onboarding_completed_${profile.id}`;
        await AsyncStorage.setItem(onboardingKey, 'true');
      }
    }

    await handleGeneratePlan(newPreferences);
  };

  const renderPlanOverview = () => {
    if (!currentPlan) {
      return (
        <View style={styles.noPlanContainer}>
          <Ionicons name="fitness" size={64} color={colors.primary} />
          <Text style={styles.noPlanTitle}>No Active Plan</Text>
          <Text style={styles.noPlanSubtitle}>
            Generate a personalized 4-week fitness plan to get started with your fitness journey!
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGeneratePlan}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    const progress = getPlanProgress();
    const isCompleted = isPlanCompleted();

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.planContainer}
        scrollEventThrottle={16}
      >
        {/* Plan Header */}
        <View style={styles.planHeader}>
          <View style={styles.planTitleContainer}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.planTitle}>{currentPlan.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => setShowPlanModal(true)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.completed} of {progress.total} workouts completed
          </Text>
        </View>

        {/* Week Progress */}
        <View style={styles.weeksContainer}>
          <Text style={styles.weeksTitle}>Weekly Progress</Text>
          <View style={styles.weeksGrid}>
            {currentPlan.weeks.map((week, index) => {
              const weekProgress = getWeekProgress(index + 1);
              return (
                <View key={index} style={styles.weekCard}>
                  <Text style={styles.weekNumber}>Week {index + 1}</Text>
                  <Text style={styles.weekFocus}>{week.focus}</Text>
                  <View style={styles.weekProgressBar}>
                    <View style={[styles.weekProgressFill, { width: `${weekProgress.percentage}%` }]} />
                  </View>
                  <Text style={styles.weekProgressText}>
                    {weekProgress.completed}/{weekProgress.total}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowPlanModal(true)}
          >
            <Ionicons name="eye" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>View Plan</Text>
          </TouchableOpacity>
          
        </View>

        {/* Workout Calendar - Shows the plan in a visual calendar format */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.calendarTitle}>Your Workout Calendar</Text>
          </View>
          <WorkoutCalendar plan={currentPlan} />
        </View>
      </ScrollView>
    );
  };

  const renderPlanDetails = () => {
    if (!currentPlan) return null;

    return (
      <ScrollView style={styles.planDetails}>
        {currentPlan.weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekSection}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {weekIndex + 1}</Text>
              <Text style={styles.weekFocus}>{week.focus}</Text>
            </View>
            
            {week.days.map((day, dayIndex) => (
              <View key={dayIndex} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.day_name}</Text>
                  {day.is_workout_day ? (
                    <View style={styles.workoutBadge}>
                      <Ionicons name="fitness" size={16} color={colors.white} />
                      <Text style={styles.workoutBadgeText}>Workout</Text>
                    </View>
                  ) : (
                    <View style={styles.restBadge}>
                      <Ionicons name="bed" size={16} color={colors.textMedium} />
                      <Text style={styles.restBadgeText}>Rest</Text>
                    </View>
                  )}
                </View>
                
                {day.is_workout_day && day.workout && (
                  <View style={styles.workoutDetails}>
                    <Text style={styles.workoutType}>{day.workout.type}</Text>
                    <Text style={styles.workoutDuration}>
                      {day.workout.duration_minutes} minutes
                    </Text>
                    <Text style={styles.workoutDifficulty}>
                      Difficulty: {day.workout.difficulty}
                    </Text>
                    
                    {day.workout.exercises && day.workout.exercises.length > 0 && (
                      <View style={styles.exercisesList}>
                        <Text style={styles.exercisesTitle}>Exercises:</Text>
                        {day.workout.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
                          <Text key={exerciseIndex} style={styles.exerciseItem}>
                            • {exercise.name}
                            {exercise.sets && ` (${exercise.sets} sets)`}
                            {exercise.reps && ` x ${exercise.reps} reps`}
                            {exercise.duration && ` - ${exercise.duration} min`}
                          </Text>
                        ))}
                        {day.workout.exercises.length > 3 && (
                          <Text style={styles.moreExercises}>
                            +{day.workout.exercises.length - 3} more exercises
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <PremiumBackground>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Workout Plans</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGeneratePlan}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderPlanOverview()
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowPreferences(true)}
        >
          <Ionicons name="settings" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Preferences</Text>
        </TouchableOpacity>
        
      </View>

      {/* Status Message */}
      {statusMessage && (
        <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.errorBanner : styles.successBanner]}>
          <Ionicons name={statusMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={statusMessage.type === 'error' ? colors.error : colors.success} />
          <Text style={[styles.statusText, statusMessage.type === 'error' ? styles.errorStatusText : styles.successStatusText]}>{statusMessage.text}</Text>
          <TouchableOpacity onPress={() => setStatusMessage(null)}>
            <Ionicons name="close" size={18} color={colors.textMedium} />
          </TouchableOpacity>
        </View>
      )}

      {/* Plan Details Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plan Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlanModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </TouchableOpacity>
          </View>
          {renderPlanDetails()}
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={showPreferences}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreferences(false)}
      >
        <PreferencesScreen 
          currentPreferences={savedPreferences}
          onSave={handlePreferencesSaved}
          onCancel={() => setShowPreferences(false)}
        />
      </Modal>

      {/* Plan Generation Progress Modal */}
      <Modal
        visible={showGenerationModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.generationModalOverlay}>
          <View style={styles.generationModalContainer}>
            <View style={styles.generationHeader}>
              <CircularProgress 
                progress={generationProgress}
                size={140}
                strokeWidth={10}
                color={colors.primary}
                backgroundColor="#E5E7EB"
                showPercentage={true}
              />
              <Text style={styles.generationTitle}>Creating Your Plan</Text>
            </View>
            
            <View style={styles.generationContent}>
              <Text style={styles.generationStep}>{generationStep}</Text>
              
              <View style={styles.generationWarning}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={styles.generationWarningText}>
                  Please don't close the app or leave this page while we create your personalized workout plan.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* New User Welcome Modal */}
      <Modal
        visible={showNewUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewUserModal(false)}
      >
        <View style={styles.newUserModalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.newUserCloseButton}
            onPress={async () => {
              setShowNewUserModal(false);
              if (profile) {
                const onboardingKey = `onboarding_completed_${profile.id}`;
                await AsyncStorage.setItem(onboardingKey, 'true');
              }
            }}
          >
            <Ionicons name="close" size={24} color={colors.textMedium} />
          </TouchableOpacity>
          
          <View style={styles.newUserHeader}>
            <Ionicons name="sparkles" size={48} color={colors.primary} />
            <Text style={styles.newUserTitle}>Welcome to StrideCoach!</Text>
            <Text style={styles.newUserSubtitle}>
              Let's set up your personalized workout preferences to create your perfect fitness plan.
            </Text>
          </View>
          
          <View style={styles.newUserContent}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.featureText}>Customized workout types</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.featureText}>Flexible schedule options</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.featureText}>AI-powered plan generation</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.featureText}>Progress tracking</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.newUserActions}>
            <TouchableOpacity
              style={styles.newUserButton}
              onPress={() => {
                setShowNewUserModal(false);
                setShowPreferences(true);
                // Don't mark onboarding as completed yet - 
                // it will be marked when preferences are saved
              }}
            >
              <Ionicons name="settings" size={20} color={colors.white} />
              <Text style={styles.newUserButtonText}>Set My Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
    fontFamily: fonts.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.body,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPlanTitle: {
    fontSize: 24,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  noPlanSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: fonts.body,
  },
  generateButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  planContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
    marginLeft: 8,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    marginRight: 4,
  },
  progressContainer: {
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.10)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 18 },
    }),
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  progressPercentage: {
    fontSize: 20,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textMedium,
    fontFamily: fonts.body,
  },
  weeksContainer: {
    marginBottom: 20,
  },
  weeksTitle: {
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textDark,
    marginBottom: 12,
  },
  weeksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weekCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 32px rgba(15, 23, 42, 0.08)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16 },
    }),
    elevation: 4,
  },
  weekNumber: {
    fontSize: 16,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
    marginBottom: 4,
  },
  weekFocus: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 12,
  },
  weekProgressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  weekProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  weekProgressText: {
    fontSize: 12,
    color: colors.textMedium,
    fontFamily: fonts.body,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  closeButton: {
    padding: 8,
  },
  planDetails: {
    flex: 1,
    padding: 16,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 20,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  weekFocus: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 4,
  },
  dayCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 32px rgba(15, 23, 42, 0.08)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16 },
    }),
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  workoutBadge: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    marginLeft: 4,
  },
  restBadge: {
    backgroundColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restBadgeText: {
    color: colors.textMedium,
    fontSize: 12,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    marginLeft: 4,
  },
  workoutDetails: {
    marginTop: 8,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  workoutDifficulty: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 8,
  },
  exercisesList: {
    marginTop: 8,
  },
  exercisesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  exerciseItem: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 2,
  },
  moreExercises: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  calendarSection: {
    marginTop: 20,
    paddingBottom: 20,
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  // New User Modal Styles
  newUserModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  newUserCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
  },
  // Generation Progress Modal Styles
  generationModalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generationModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    alignItems: 'center',
  },
  generationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  generationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 16,
  },
  generationContent: {
    alignItems: 'center',
    width: '100%',
  },
  generationStep: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  generationWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  generationWarningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  newUserHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  newUserTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  newUserSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  newUserContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureList: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.textBody,
    marginLeft: 12,
    fontWeight: '500',
  },
  newUserActions: {
    paddingTop: 20,
  },
  newUserButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  newUserButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
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
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorStatusText: {
    color: colors.error,
  },
  successStatusText: {
    color: colors.success,
  },
});
