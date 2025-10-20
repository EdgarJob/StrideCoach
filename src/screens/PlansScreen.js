import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import PreferencesScreen from './PreferencesScreen';
import WorkoutBuilder from '../components/WorkoutBuilder';
import WorkoutCalendar from '../components/WorkoutCalendar';

export default function PlansScreen() {
  const navigation = useNavigation();
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
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    
    // Use custom preferences or the saved preferences from state
    const preferences = customPreferences || savedPreferences;

    console.log('Generating plan with preferences:', preferences);

    const result = await generatePlan(preferences);
    
    if (result.success) {
      Alert.alert(
        'Plan Generated!',
        'Your personalized 4-week fitness plan has been created successfully!',
        [{ text: 'OK', onPress: () => setShowPlanModal(true) }]
      );
    } else {
      Alert.alert(
        'Error',
        `Failed to generate plan: ${result.error}`,
        [{ text: 'OK' }]
      );
    }
    
    setIsGenerating(false);
  };

  const handleSaveCustomPlan = (customPlan) => {
    // Here you would save the custom plan to your database
    Alert.alert(
      'Plan Saved!',
      'Your custom workout plan has been saved successfully!',
      [{ text: 'OK' }]
    );
    console.log('Custom plan saved:', customPlan);
  };

  const handlePreferencesSaved = (newPreferences) => {
    console.log('Preferences saved, updating state:', newPreferences);
    setSavedPreferences(newPreferences);
    setShowPreferences(false);
  };

  const renderPlanOverview = () => {
    if (!currentPlan) {
      return (
        <View style={styles.noPlanContainer}>
          <Ionicons name="fitness" size={64} color="#4F46E5" />
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
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
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.planContainer}>
        {/* Plan Header */}
        <View style={styles.planHeader}>
          <View style={styles.planTitleContainer}>
            <Ionicons name="calendar" size={24} color="#4F46E5" />
            <Text style={styles.planTitle}>{currentPlan.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => setShowPlanModal(true)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
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
            <Ionicons name="eye" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>View Plan</Text>
          </TouchableOpacity>
          
          {!isCompleted && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGeneratePlan}
              disabled={isGenerating}
            >
              <Ionicons name="refresh" size={20} color="#4F46E5" />
              <Text style={styles.secondaryButtonText}>Regenerate</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Workout Calendar - Shows the plan in a visual calendar format */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Ionicons name="calendar" size={24} color="#4F46E5" />
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
                      <Ionicons name="fitness" size={16} color="#FFFFFF" />
                      <Text style={styles.workoutBadgeText}>Workout</Text>
                    </View>
                  ) : (
                    <View style={styles.restBadge}>
                      <Ionicons name="bed" size={16} color="#6B7280" />
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={24} color="#4F46E5" />
        <Text style={styles.headerTitle}>Workout Plans</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
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
          <Ionicons name="settings" size={20} color="#4F46E5" />
          <Text style={styles.actionButtonText}>Preferences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowWorkoutBuilder(true)}
        >
          <Ionicons name="build" size={20} color="#4F46E5" />
          <Text style={styles.actionButtonText}>Build Plan</Text>
        </TouchableOpacity>
        
        {currentPlan && (
          <TouchableOpacity
            style={[styles.actionButton, styles.regenerateButton]}
            onPress={() => handleGeneratePlan()}
            disabled={isGenerating}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.regenerateButtonText]}>
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
              <Ionicons name="close" size={24} color="#6B7280" />
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

      {/* Workout Builder Modal */}
      <WorkoutBuilder
        isVisible={showWorkoutBuilder}
        onClose={() => setShowWorkoutBuilder(false)}
        onSave={handleSaveCustomPlan}
        userProfile={profile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noPlanSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  generateButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  weeksContainer: {
    marginBottom: 20,
  },
  weeksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  weeksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weekCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  weekFocus: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  weekProgressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  weekProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  weekProgressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
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
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weekFocus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  workoutBadge: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  restBadge: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  workoutDetails: {
    marginTop: 8,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  workoutDifficulty: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  exercisesList: {
    marginTop: 8,
  },
  exercisesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  moreExercises: {
    fontSize: 12,
    color: '#4F46E5',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 6,
  },
  regenerateButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  regenerateButtonText: {
    color: '#FFFFFF',
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
    color: '#1F2937',
  },
});
