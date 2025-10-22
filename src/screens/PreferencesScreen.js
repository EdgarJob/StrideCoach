import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export default function PreferencesScreen({ currentPreferences, onSave, onCancel }) {
  const [preferences, setPreferences] = useState(currentPreferences || {
    // Workout Types
    workoutTypes: {
      walking: true,
      running: false,
      strength: true,
      yoga: false,
      cycling: false,
      swimming: false,
    },
    // Available Days
    availableDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false,
    },
    // Workout Settings
    workoutDuration: 30,
    difficultyLevel: 'beginner',
    primaryGoal: 'general_fitness',
    // Equipment
    hasEquipment: {
      none: true,
      dumbbells: false,
      resistance_bands: false,
      yoga_mat: false,
      treadmill: false,
      bike: false,
    },
    // Timing
    preferredTime: 'morning',
    // Additional Preferences
    experienceLevel: 'beginner',
    fitnessGoals: [],
    limitations: [],
    customNotes: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);

  const updatePreference = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateArrayPreference = (category, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      // Call the onSave callback with the preferences
      if (onSave) {
        onSave(preferences);
      }
      
      Alert.alert(
        'Success', 
        'Your preferences have been saved!',
        [
          {
            text: 'OK'
          }
        ]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', `Failed to save preferences. ${error.message || ''}`.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkoutTypes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Workout Types</Text>
      <Text style={styles.sectionSubtitle}>Select the types of workouts you enjoy</Text>
      {Object.entries(preferences.workoutTypes).map(([type, selected]) => (
        <TouchableOpacity
          key={type}
          style={styles.optionRow}
          onPress={() => updatePreference('workoutTypes', type, !selected)}
        >
          <View style={styles.optionContent}>
            <Ionicons 
              name={getWorkoutIcon(type)} 
              size={24} 
              color={selected ? '#4F46E5' : '#9CA3AF'} 
            />
            <Text style={[styles.optionText, selected && styles.selectedText]}>
              {getWorkoutLabel(type)}
            </Text>
          </View>
          <Switch
            value={selected}
            onValueChange={(value) => updatePreference('workoutTypes', type, value)}
            trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
            thumbColor={selected ? '#4F46E5' : '#F3F4F6'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAvailableDays = () => {
    // Define days in proper chronological order (Monday to Sunday)
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Days</Text>
        <Text style={styles.sectionSubtitle}>Select the days you can work out</Text>
        {dayOrder.map((day) => {
          const selected = preferences.availableDays[day];
          return (
            <TouchableOpacity
              key={day}
              style={styles.optionRow}
              onPress={() => updatePreference('availableDays', day, !selected)}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name="calendar" 
                  size={24} 
                  color={selected ? '#4F46E5' : '#9CA3AF'} 
                />
                <Text style={[styles.optionText, selected && styles.selectedText]}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
              </View>
              <Switch
                value={selected}
                onValueChange={(value) => updatePreference('availableDays', day, value)}
                trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
                thumbColor={selected ? '#4F46E5' : '#F3F4F6'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderWorkoutSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Workout Settings</Text>
      
      {/* Duration */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Workout Duration (minutes)</Text>
        <View style={styles.durationContainer}>
          {[15, 30, 45, 60, 90].map(duration => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationButton,
                preferences.workoutDuration === duration && styles.durationButtonSelected
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, workoutDuration: duration }))}
            >
              <Text style={[
                styles.durationButtonText,
                preferences.workoutDuration === duration && styles.durationButtonTextSelected
              ]}>
                {duration}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Difficulty Level</Text>
        <View style={styles.difficultyContainer}>
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                preferences.difficultyLevel === level && styles.difficultyButtonSelected
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, difficultyLevel: level }))}
            >
              <Text style={[
                styles.difficultyButtonText,
                preferences.difficultyLevel === level && styles.difficultyButtonTextSelected
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Primary Goal */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Primary Goal</Text>
        <View style={styles.goalContainer}>
          {[
            { key: 'general_fitness', label: 'General Fitness' },
            { key: 'weight_loss', label: 'Weight Loss' },
            { key: 'muscle_gain', label: 'Muscle Gain' },
            { key: 'endurance', label: 'Endurance' },
            { key: 'strength', label: 'Strength' },
            { key: 'flexibility', label: 'Flexibility' }
          ].map(goal => (
            <TouchableOpacity
              key={goal.key}
              style={[
                styles.goalButton,
                preferences.primaryGoal === goal.key && styles.goalButtonSelected
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, primaryGoal: goal.key }))}
            >
              <Text style={[
                styles.goalButtonText,
                preferences.primaryGoal === goal.key && styles.goalButtonTextSelected
              ]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEquipment = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Equipment</Text>
      <Text style={styles.sectionSubtitle}>Select the equipment you have access to</Text>
      {Object.entries(preferences.hasEquipment).map(([equipment, selected]) => (
        <TouchableOpacity
          key={equipment}
          style={styles.optionRow}
          onPress={() => updatePreference('hasEquipment', equipment, !selected)}
        >
          <View style={styles.optionContent}>
            <Ionicons 
              name={getEquipmentIcon(equipment)} 
              size={24} 
              color={selected ? '#4F46E5' : '#9CA3AF'} 
            />
            <Text style={[styles.optionText, selected && styles.selectedText]}>
              {getEquipmentLabel(equipment)}
            </Text>
          </View>
          <Switch
            value={selected}
            onValueChange={(value) => updatePreference('hasEquipment', equipment, value)}
            trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
            thumbColor={selected ? '#4F46E5' : '#F3F4F6'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTiming = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferred Workout Time</Text>
      <View style={styles.timingContainer}>
        {[
          { key: 'morning', label: 'Morning', icon: 'sunny' },
          { key: 'afternoon', label: 'Afternoon', icon: 'partly-sunny' },
          { key: 'evening', label: 'Evening', icon: 'moon' },
          { key: 'flexible', label: 'Flexible', icon: 'time' }
        ].map(time => (
          <TouchableOpacity
            key={time.key}
            style={[
              styles.timingButton,
              preferences.preferredTime === time.key && styles.timingButtonSelected
            ]}
            onPress={() => setPreferences(prev => ({ ...prev, preferredTime: time.key }))}
          >
            <Ionicons 
              name={time.icon} 
              size={24} 
              color={preferences.preferredTime === time.key ? '#FFFFFF' : '#4F46E5'} 
            />
            <Text style={[
              styles.timingButtonText,
              preferences.preferredTime === time.key && styles.timingButtonTextSelected
            ]}>
              {time.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel || (() => {})}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Preferences</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePreferences}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderWorkoutTypes()}
        {renderAvailableDays()}
        {renderWorkoutSettings()}
        {renderEquipment()}
        {renderTiming()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

// Helper functions
const getWorkoutIcon = (type) => {
  const icons = {
    walking: 'walk',
    running: 'fitness',
    strength: 'barbell',
    yoga: 'leaf',
    cycling: 'bicycle',
    swimming: 'water'
  };
  return icons[type] || 'fitness';
};

const getWorkoutLabel = (type) => {
  const labels = {
    walking: 'Walking',
    running: 'Running',
    strength: 'Strength Training',
    yoga: 'Yoga',
    cycling: 'Cycling',
    swimming: 'Swimming'
  };
  return labels[type] || type;
};

const getEquipmentIcon = (equipment) => {
  const icons = {
    none: 'body',
    dumbbells: 'barbell',
    resistance_bands: 'fitness',
    yoga_mat: 'leaf',
    treadmill: 'walk',
    bike: 'bicycle'
  };
  return icons[equipment] || 'fitness';
};

const getEquipmentLabel = (equipment) => {
  const labels = {
    none: 'No Equipment (Bodyweight)',
    dumbbells: 'Dumbbells',
    resistance_bands: 'Resistance Bands',
    yoga_mat: 'Yoga Mat',
    treadmill: 'Treadmill',
    bike: 'Stationary Bike'
  };
  return labels[equipment] || equipment;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  selectedText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  durationButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  durationButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  difficultyButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  goalButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  goalButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timingButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  timingButtonSelected: {
    backgroundColor: '#4F46E5',
  },
  timingButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 4,
    fontWeight: '600',
  },
  timingButtonTextSelected: {
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 40,
  },
});
