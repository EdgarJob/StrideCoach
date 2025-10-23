import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * WorkoutCalendar Component
 * 
 * What it does:
 * - Displays a workout plan in a calendar format showing weeks and days
 * - Shows detailed workout information for each day
 * - Allows navigation between weeks
 * - Displays rest days and workout days differently
 * 
 * Why it's built this way:
 * - Calendar format makes it easy to see the whole week at a glance
 * - Color coding helps quickly identify workout types
 * - Week navigation allows users to see their entire 4-week plan
 * 
 * How it fits in:
 * - Used in PlansScreen to visualize the generated workout plan
 * - Makes the plan easy to understand and follow
 */
export default function WorkoutCalendar({ plan }) {
  // State to track which week is currently being displayed
  const [selectedWeek, setSelectedWeek] = useState(0);

  // ✅ DEBUG: Log the plan object to see what we're getting
  console.log('🔍 WorkoutCalendar received plan:', {
    plan,
    planType: typeof plan,
    planIsNull: plan === null,
    planIsUndefined: plan === undefined,
    planWeeks: plan?.weeks,
    planWeeksLength: plan?.weeks?.length,
    planKeys: plan ? Object.keys(plan) : 'N/A'
  });

  // If no plan exists, show a message
  if (!plan || !plan.weeks || plan.weeks.length === 0) {
    console.log('🚫 WorkoutCalendar: No plan data, showing no data message');
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No workout plan available</Text>
      </View>
    );
  }

  // Get the current week's data
  const currentWeek = plan.weeks[selectedWeek];
  
  // Days of the week labels (full names for mapping)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Get abbreviated day label from full day name
  const getDayLabel = (dayName) => {
    const dayMap = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    return dayMap[dayName] || dayName.substring(0, 3);
  };

  /**
   * Function to get the icon and color for different workout types
   * This helps users quickly identify what kind of workout it is
   */
  const getWorkoutIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'walking':
        return { name: 'walk', color: '#10B981' };
      case 'running':
        return { name: 'fitness', color: '#F59E0B' };
      case 'strength':
        return { name: 'barbell', color: '#EF4444' };
      case 'yoga':
        return { name: 'body', color: '#8B5CF6' };
      case 'cycling':
        return { name: 'bicycle', color: '#3B82F6' };
      case 'swimming':
        return { name: 'water', color: '#06B6D4' };
      default:
        return { name: 'fitness-outline', color: '#6B7280' };
    }
  };

  /**
   * Function to show full workout details when a day is clicked
   */
  const handleDayPress = (day, dayName) => {
    if (day.is_rest_day || !day.workout) {
      Alert.alert(
        '😴 Rest Day',
        'Take this day to rest and recover. Your body needs time to rebuild and get stronger!',
        [{ text: 'OK' }]
      );
      return;
    }

    const workout = day.workout;
    const exercises = workout.exercises || [];
    
    // Format the exercise list for display
    const exerciseList = exercises.map((ex, idx) => {
      let details = `${idx + 1}. ${ex.name || ex.exercise}`;
      if (ex.sets && ex.reps) {
        details += `\n   ${ex.sets} sets × ${ex.reps} reps`;
      } else if (ex.sets && ex.duration) {
        details += `\n   ${ex.sets} sets - ${ex.duration} min`;
      } else if (ex.duration) {
        details += `\n   ${ex.duration} min`;
      } else if (ex.sets) {
        details += `\n   ${ex.sets} sets`;
      }
      return details;
    }).join('\n\n');

    const workoutInfo = `
🏋️ Type: ${workout.type}
⏱️ Duration: ${workout.duration_minutes} minutes
📊 Difficulty: ${workout.difficulty || 'beginner'}
${workout.notes ? `\n📝 Notes: ${workout.notes}` : ''}

💪 Exercises (${exercises.length}):

${exerciseList}
    `.trim();

    Alert.alert(
      `${dayName} Workout`,
      workoutInfo,
      [{ text: 'Got it!' }],
      { cancelable: true }
    );
  };

  /**
   * Render a single day in the calendar
   * Shows either workout details or "Rest Day"
   */
  const renderDay = (day, index) => {
    const isRestDay = day.is_rest_day || !day.workout;
    const workoutIcon = day.workout ? getWorkoutIcon(day.workout.type) : null;
    const dayLabel = getDayLabel(day.day_name);

    return (
      <TouchableOpacity 
        key={index} 
        style={styles.dayCard}
        onPress={() => handleDayPress(day, day.day_name)}
        activeOpacity={0.7}
      >
        {/* Day label (Mon, Tue, etc.) */}
        <View style={[styles.dayHeader, isRestDay && styles.restDayHeader]}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
        </View>

        {/* Day content - either workout details or rest day message */}
        {isRestDay ? (
          <View style={styles.restDayContent}>
            <Ionicons name="moon" size={32} color="#94A3B8" />
            <Text style={styles.restDayText}>Rest Day</Text>
            <Text style={styles.restDaySubtext}>Recovery & Relaxation</Text>
          </View>
        ) : (
          <ScrollView style={styles.workoutContent} showsVerticalScrollIndicator={false}>
            {/* Workout type icon */}
            <Ionicons 
              name={workoutIcon.name} 
              size={32} 
              color={workoutIcon.color} 
            />
            
            {/* Workout type name */}
            <Text style={[styles.workoutType, { color: workoutIcon.color }]}>
              {day.workout.type}
            </Text>

            {/* Workout duration and difficulty */}
            <View style={styles.workoutMeta}>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.durationText}>
                  {day.workout.duration_minutes} min
                </Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Ionicons name="fitness-outline" size={14} color="#F59E0B" />
                <Text style={styles.difficultyText}>
                  {day.workout.difficulty || 'beginner'}
                </Text>
              </View>
            </View>

            {/* Exercise list - grouped by sections */}
            {day.workout.exercises && day.workout.exercises.length > 0 && (
              <View style={styles.exerciseSection}>
                {day.workout.exercises.map((exercise, idx) => {
                  // Check if this is a section header (from AI response or parsing)
                  const isSection = exercise.isSection === true;
                  const isRepeatGroup = exercise.isRepeatGroup === true;

                  // If it's a section header, render it differently
                  if (isSection) {
                    // ✅ Filter out invalid section names
                    const sectionName = (exercise.name || exercise.exercise || '').trim();
                    
                    console.log('📌 SECTION HEADER:', {
                      idx,
                      sectionName,
                      sectionNameLength: sectionName.length,
                      isRepeatGroup,
                      fullExercise: exercise
                    });
                    
                    if (!sectionName || sectionName === '.' || sectionName.length === 0) {
                      console.warn('❌ SKIPPED SECTION:', sectionName);
                      return null; // Skip invalid sections
                    }
                    
                    // ✅ NEW: Different styling for repeat groups (e.g., "4 Rounds")
                    const headerStyle = isRepeatGroup 
                      ? styles.repeatGroupHeader 
                      : styles.sectionHeader;
                    const titleStyle = isRepeatGroup 
                      ? styles.repeatGroupTitle 
                      : styles.sectionTitle;
                    
                    return (
                      <View key={idx} style={headerStyle}>
                        <Text style={titleStyle}>
                          {isRepeatGroup && '🔁 '}
                          {sectionName}
                        </Text>
                      </View>
                    );
                  }

                  // Format exercise details (cleaner, simpler format)
                  let detailsText = '';
                  
                  // Prioritize description field (which contains full details)
                  // ✅ FIX: Validate description is not just punctuation
                  if (exercise.description && 
                      exercise.description !== exercise.name &&
                      exercise.description.trim().length > 1 &&
                      !/^[\s\.\,\;\:]+$/.test(exercise.description)) {
                    detailsText = exercise.description;
                  } 
                  // Otherwise, build from duration or reps
                  else if (exercise.duration_minutes && exercise.duration_minutes > 0) {
                    // Don't show duration if it's already in the name
                    if (!exercise.name?.toLowerCase().includes('min') && 
                        !exercise.name?.toLowerCase().includes('sec')) {
                      detailsText = `${exercise.duration_minutes} min`;
                    }
                  } 
                  // ✅ FIX: Only show reps for NON-CARDIO exercises
                  // Don't show reps for running/walking/cardio exercises (they use distance/time)
                  else if (exercise.reps && exercise.reps > 0) {
                    const isCardio = exercise.name?.toLowerCase().includes('km') || 
                                    exercise.name?.toLowerCase().includes('run') ||
                                    exercise.name?.toLowerCase().includes('walk') ||
                                    exercise.name?.toLowerCase().includes('jog') ||
                                    exercise.name?.toLowerCase().includes('rest') ||
                                    exercise.name?.toLowerCase().includes('pace');
                    
                    // Only show reps for strength/non-cardio exercises
                    if (!isCardio && !exercise.name?.toLowerCase().includes(' x ')) {
                      detailsText = `${exercise.reps} reps`;
                    }
                  }

                  // ✅ ULTRA DEBUG: Log the RAW exercise object BEFORE trimming
                  console.log('🔎 RAW EXERCISE BEFORE PROCESSING:', {
                    idx,
                    rawName: exercise.name,
                    rawExercise: exercise.exercise,
                    rawDescription: exercise.description,
                    fullRawObject: exercise
                  });
                  
                  // Regular exercise item
                  const exerciseName = (exercise.name || exercise.exercise || '').trim();
                  
                  // ✅ COMPREHENSIVE: Skip if invalid (empty, period, whitespace, or other punctuation)
                  if (!exerciseName || 
                      exerciseName.length === 0 || 
                      exerciseName === '.' || 
                      exerciseName === ',' ||
                      exerciseName === ';' ||
                      exerciseName === ':' ||
                      /^[\s\.\,\;\:]+$/.test(exerciseName)) {  // Only punctuation/whitespace
                    console.log('⚠️ Skipping invalid exercise:', exercise);
                    return null;
                  }
                  
                  // ✅ DEBUG: Log EVERYTHING about this exercise
                  console.log('🔍 Rendering exercise:', {
                    idx,
                    exerciseName,
                    exerciseNameLength: exerciseName.length,
                    exerciseNameCharCodes: Array.from(exerciseName).map(c => c.charCodeAt(0)),
                    detailsText,
                    detailsTextLength: detailsText?.length || 0,
                    fullExercise: exercise
                  });
                  
                  // ✅ NUCLEAR OPTION: If exerciseName contains ONLY punctuation/whitespace, skip it
                  if (!exerciseName || exerciseName.trim().length === 0 || /^[\s\.\,\;\:\!\?\-\_]+$/.test(exerciseName)) {
                    console.warn('❌ SKIPPED: Exercise name is invalid:', exerciseName);
                    return null;
                  }
                  
                  // ✅ FINAL SAFETY CHECK: Ensure exerciseName is a valid string with actual content
                  const safeExerciseName = exerciseName && typeof exerciseName === 'string' && exerciseName.trim().length > 1 && !/^[\.\,\;\:\!\?\-\_]+$/.test(exerciseName.trim()) 
                    ? exerciseName 
                    : null;
                  
                  if (!safeExerciseName) {
                    console.error('🚨 BLOCKED: Invalid exercise name would cause text node error:', exerciseName);
                    return null;
                  }
                  
                  return (
                    <View key={idx} style={styles.exerciseItem}>
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName} numberOfLines={3}>
                          {safeExerciseName}
                        </Text>
                        {detailsText && detailsText.trim().length > 1 && !/^[\s\.\,\;\:\!\?\-\_]+$/.test(detailsText) && (
                          <Text style={styles.exerciseInfo}>{detailsText}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Week selector header */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={[styles.weekButton, selectedWeek === 0 && styles.weekButtonDisabled]}
          onPress={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
          disabled={selectedWeek === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={selectedWeek === 0 ? '#CBD5E1' : '#4F46E5'} 
          />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>Week {selectedWeek + 1}</Text>
          {currentWeek.focus && (
            <Text style={styles.weekFocus}>Focus: {currentWeek.focus}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.weekButton,
            selectedWeek === plan.weeks.length - 1 && styles.weekButtonDisabled
          ]}
          onPress={() => setSelectedWeek(Math.min(plan.weeks.length - 1, selectedWeek + 1))}
          disabled={selectedWeek === plan.weeks.length - 1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedWeek === plan.weeks.length - 1 ? '#CBD5E1' : '#4F46E5'} 
          />
        </TouchableOpacity>
      </View>

      {/* Week progress indicator */}
      <View style={styles.weekProgress}>
        {plan.weeks.map((_, index) => (
          <View
            key={index}
            style={[
              styles.weekDot,
              index === selectedWeek && styles.weekDotActive
            ]}
          />
        ))}
      </View>

      {/* Calendar grid showing all 7 days */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarGrid}
        style={styles.calendarScrollView}
        centerContent={true}
      >
        {currentWeek.days && currentWeek.days.map((day, index) => renderDay(day, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    width: '100%',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 32,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  weekButton: {
    padding: 8,
  },
  weekButtonDisabled: {
    opacity: 0.3,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekFocus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  weekDotActive: {
    width: 24,
    backgroundColor: '#4F46E5',
  },
  calendarScrollView: {
    width: '100%',
  },
  calendarGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dayCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    height: 520,
    boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  dayHeader: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    alignItems: 'center',
  },
  restDayHeader: {
    backgroundColor: '#94A3B8',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restDayContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  restDayText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '600',
  },
  restDaySubtext: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
    fontStyle: 'italic',
  },
  workoutContent: {
    padding: 12,
    flex: 1,
  },
  workoutType: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  exerciseSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  // ✅ NEW: Styles for repeat group headers (e.g., "4 Rounds", "Repeat x3")
  repeatGroupHeader: {
    backgroundColor: '#EEF2FF',  // Lighter indigo background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',  // Indigo accent
  },
  repeatGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',  // Indigo text
    fontStyle: 'italic',
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    paddingLeft: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  exerciseNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    marginRight: 10,
    marginTop: 2,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  moreExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  moreExercisesText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
});

