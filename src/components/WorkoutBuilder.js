// TODO: This component is currently unused and not rendered in any screen.
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function WorkoutBuilder({ isVisible, onClose, onSave, userProfile }) {
  const [workoutPlan, setWorkoutPlan] = useState({
    title: '',
    description: '',
    duration: 4, // weeks
    difficulty: 'beginner',
    focus: 'general_fitness',
    workouts: []
  });

  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState('monday');
  const [validationError, setValidationError] = useState(null);

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const addWorkout = () => {
    const newWorkout = {
      id: Date.now(),
      day: currentDay,
      week: currentWeek,
      type: 'walking',
      duration: 30,
      exercises: [],
      notes: ''
    };

    setWorkoutPlan(prev => ({
      ...prev,
      workouts: [...prev.workouts, newWorkout]
    }));
  };

  const updateWorkout = (workoutId, updates) => {
    setWorkoutPlan(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout =>
        workout.id === workoutId ? { ...workout, ...updates } : workout
      )
    }));
  };

  const removeWorkout = (workoutId) => {
    setWorkoutPlan(prev => ({
      ...prev,
      workouts: prev.workouts.filter(workout => workout.id !== workoutId)
    }));
  };

  const addExercise = (workoutId) => {
    const newExercise = {
      id: Date.now(),
      name: '',
      sets: 1,
      reps: 10,
      duration: 0,
      rest: 30
    };

    updateWorkout(workoutId, {
      exercises: [...(workoutPlan.workouts.find(w => w.id === workoutId)?.exercises || []), newExercise]
    });
  };

  const updateExercise = (workoutId, exerciseId, updates) => {
    const workout = workoutPlan.workouts.find(w => w.id === workoutId);
    if (workout) {
      const updatedExercises = workout.exercises.map(exercise =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      );
      updateWorkout(workoutId, { exercises: updatedExercises });
    }
  };

  const removeExercise = (workoutId, exerciseId) => {
    const workout = workoutPlan.workouts.find(w => w.id === workoutId);
    if (workout) {
      const updatedExercises = workout.exercises.filter(exercise => exercise.id !== exerciseId);
      updateWorkout(workoutId, { exercises: updatedExercises });
    }
  };

  const getWorkoutsForCurrentWeek = () => {
    return workoutPlan.workouts.filter(workout => workout.week === currentWeek);
  };

  const getWorkoutsForCurrentDay = () => {
    return getWorkoutsForCurrentWeek().filter(workout => workout.day === currentDay);
  };

  const renderWeekSelector = () => (
    <View style={styles.weekSelector}>
      <Text style={styles.selectorTitle}>Week {currentWeek}</Text>
      <View style={styles.weekButtons}>
        {[1, 2, 3, 4].map(week => (
          <TouchableOpacity
            key={week}
            style={[
              styles.weekButton,
              currentWeek === week && styles.weekButtonSelected
            ]}
            onPress={() => setCurrentWeek(week)}
          >
            <Text style={[
              styles.weekButtonText,
              currentWeek === week && styles.weekButtonTextSelected
            ]}>
              {week}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDaySelector = () => (
    <View style={styles.daySelector}>
      <Text style={styles.selectorTitle}>Select Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dayButtons}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                currentDay === day && styles.dayButtonSelected
              ]}
              onPress={() => setCurrentDay(day)}
            >
              <Text style={[
                styles.dayButtonText,
                currentDay === day && styles.dayButtonTextSelected
              ]}>
                {weekNames[index].substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderWorkoutCard = (workout) => (
    <View key={workout.id} style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutTitle}>
          {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Workout
        </Text>
        <TouchableOpacity
          onPress={() => removeWorkout(workout.id)}
          style={styles.removeButton}
        >
          <Ionicons name="close" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.workoutDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <TextInput
            style={styles.detailInput}
            value={workout.duration.toString()}
            onChangeText={(text) => updateWorkout(workout.id, { duration: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="30"
          />
          <Text style={styles.detailUnit}>min</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <View style={styles.typeButtons}>
            {['walking', 'running', 'strength', 'yoga'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  workout.type === type && styles.typeButtonSelected
                ]}
                onPress={() => updateWorkout(workout.id, { type })}
              >
                <Text style={[
                  styles.typeButtonText,
                  workout.type === type && styles.typeButtonTextSelected
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <Text style={styles.exercisesTitle}>Exercises</Text>
          <TouchableOpacity
            onPress={() => addExercise(workout.id)}
            style={styles.addExerciseButton}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {workout.exercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TextInput
                style={styles.exerciseNameInput}
                value={exercise.name}
                onChangeText={(text) => updateExercise(workout.id, exercise.id, { name: text })}
                placeholder="Exercise name"
              />
              <TouchableOpacity
                onPress={() => removeExercise(workout.id, exercise.id)}
                style={styles.removeExerciseButton}
              >
                <Ionicons name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.exerciseDetails}>
              <View style={styles.exerciseDetail}>
                <Text style={styles.exerciseDetailLabel}>Sets:</Text>
                <TextInput
                  style={styles.exerciseDetailInput}
                  value={exercise.sets.toString()}
                  onChangeText={(text) => updateExercise(workout.id, exercise.id, { sets: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.exerciseDetail}>
                <Text style={styles.exerciseDetailLabel}>Reps:</Text>
                <TextInput
                  style={styles.exerciseDetailInput}
                  value={exercise.reps.toString()}
                  onChangeText={(text) => updateExercise(workout.id, exercise.id, { reps: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.exerciseDetail}>
                <Text style={styles.exerciseDetailLabel}>Rest:</Text>
                <TextInput
                  style={styles.exerciseDetailInput}
                  value={exercise.rest.toString()}
                  onChangeText={(text) => updateExercise(workout.id, exercise.id, { rest: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
                <Text style={styles.exerciseDetailUnit}>sec</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const handleSave = () => {
    setValidationError(null);
    if (!workoutPlan.title.trim()) {
      setValidationError('Please enter a plan title');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    if (workoutPlan.workouts.length === 0) {
      setValidationError('Please add at least one workout');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    onSave(workoutPlan);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textMedium} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Builder</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Validation Error */}
          {validationError && (
            <View style={styles.validationBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.validationText}>{validationError}</Text>
            </View>
          )}

          {/* Plan Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Details</Text>
            <TextInput
              style={styles.titleInput}
              value={workoutPlan.title}
              onChangeText={(text) => setWorkoutPlan(prev => ({ ...prev, title: text }))}
              placeholder="Enter plan title"
            />
            <TextInput
              style={styles.descriptionInput}
              value={workoutPlan.description}
              onChangeText={(text) => setWorkoutPlan(prev => ({ ...prev, description: text }))}
              placeholder="Enter plan description"
              multiline
              numberOfLines={3}
            />
          </View>

          {renderWeekSelector()}
          {renderDaySelector()}

          {/* Current Day Workouts */}
          <View style={styles.section}>
            <View style={styles.workoutsHeader}>
              <Text style={styles.sectionTitle}>
                {weekNames[weekDays.indexOf(currentDay)]} Workouts
              </Text>
              <TouchableOpacity onPress={addWorkout} style={styles.addWorkoutButton}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addWorkoutText}>Add Workout</Text>
              </TouchableOpacity>
            </View>

            {getWorkoutsForCurrentDay().map(renderWorkoutCard)}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  weekSelector: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textBody,
    marginBottom: 12,
  },
  weekButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  weekButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekButtonText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  weekButtonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  daySelector: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  dayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: colors.white,
  },
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWorkoutText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  workoutCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  removeButton: {
    padding: 4,
  },
  workoutDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMedium,
    width: 80,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  detailUnit: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: colors.textMedium,
  },
  typeButtonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  exercisesSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBody,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addExerciseText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  exerciseCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  removeExerciseButton: {
    padding: 2,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDetailLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginRight: 4,
  },
  exerciseDetailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  exerciseDetailUnit: {
    fontSize: 12,
    color: colors.textMedium,
    marginLeft: 2,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  validationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
    marginLeft: 8,
  },
});
