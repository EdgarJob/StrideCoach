import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PremiumBackground from '../components/PremiumBackground';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

export default function PreferencesScreen({ currentPreferences, onSave, onCancel }) {
  const insets = useSafeAreaInsets();
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
  const [errorMessage, setErrorMessage] = useState(null);

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

  const generatePlan = async () => {
    setIsLoading(true);
    try {
      // Call the onSave callback with the preferences (this will save and generate plan)
      if (onSave) {
        onSave(preferences);
      }
    } catch (error) {
      setErrorMessage(`Failed to generate plan. ${error.message || ''}`.trim());
      setTimeout(() => setErrorMessage(null), 5000);
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
              color={selected ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.optionText, selected && styles.selectedText]}>
              {getWorkoutLabel(type)}
            </Text>
          </View>
          <Switch
            value={selected}
            onValueChange={(value) => updatePreference('workoutTypes', type, value)}
            trackColor={{ false: colors.border, true: colors.switchTrack }}
            thumbColor={selected ? colors.primary : colors.borderLight}
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
                  color={selected ? colors.primary : colors.textLight} 
                />
                <Text style={[styles.optionText, selected && styles.selectedText]}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
              </View>
              <Switch
                value={selected}
                onValueChange={(value) => updatePreference('availableDays', day, value)}
                trackColor={{ false: colors.border, true: colors.switchTrack }}
                thumbColor={selected ? colors.primary : colors.borderLight}
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
              color={selected ? colors.primary : colors.textLight} 
            />
            <Text style={[styles.optionText, selected && styles.selectedText]}>
              {getEquipmentLabel(equipment)}
            </Text>
          </View>
          <Switch
            value={selected}
            onValueChange={(value) => updatePreference('hasEquipment', equipment, value)}
            trackColor={{ false: colors.border, true: colors.switchTrack }}
            thumbColor={selected ? colors.primary : colors.borderLight}
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
              color={preferences.preferredTime === time.key ? colors.white : colors.primary}
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
    <PremiumBackground>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel || (() => {})}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Preferences</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generatePlan}
            disabled={isLoading}
          >
            <Ionicons name="sparkles" size={18} color={colors.white} />
            <Text style={styles.generateButtonText}>
              {isLoading ? 'Generating...' : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage(null)}>
                <Ionicons name="close" size={18} color={colors.textMedium} />
              </TouchableOpacity>
            </View>
          )}

          {renderWorkoutTypes()}
          {renderAvailableDays()}
          {renderWorkoutSettings()}
          {renderEquipment()}
          {renderTiming()}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </PremiumBackground>
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 12px 30px rgba(15, 23, 42, 0.08)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16 },
    }),
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  generateButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: colors.white,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.10)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 18 },
    }),
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.textDark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
    fontFamily: fonts.body,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textBody,
    marginLeft: 12,
  },
  selectedText: {
    color: colors.primary,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textBody,
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
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  durationButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textMedium,
  },
  durationButtonTextSelected: {
    color: colors.white,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textMedium,
  },
  difficultyButtonTextSelected: {
    color: colors.white,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  goalButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalButtonText: {
    fontSize: 12,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textMedium,
  },
  goalButtonTextSelected: {
    color: colors.white,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
  },
  timingButtonSelected: {
    backgroundColor: colors.primary,
  },
  timingButtonText: {
    fontSize: 14,
    color: colors.textDark,
    marginTop: 4,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  timingButtonTextSelected: {
    color: colors.white,
  },
  bottomSpacing: {
    height: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.error,
    marginLeft: 8,
  },
});
