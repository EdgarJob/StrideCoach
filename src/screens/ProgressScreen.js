import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlan } from '../contexts/PlanContext';
import colors from '../theme/colors';

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { currentPlan, getPlanProgress, getWeekProgress } = usePlan();

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  // Calculate real progress data from the plan
  const planProgress = getPlanProgress();

  // Calculate total active minutes from completed workouts
  const calculateActiveMinutes = () => {
    if (!currentPlan) return 0;
    let total = 0;
    currentPlan.weeks.forEach(week => {
      week.days.forEach(day => {
        if (day.is_workout_day && day.progress && day.progress.completed) {
          total += day.progress.duration_minutes || day.workout?.duration_minutes || 0;
        }
      });
    });
    return total;
  };

  // Calculate streak from plan data
  const calculateStreak = () => {
    if (!currentPlan) return 0;
    let streak = 0;
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    for (let i = daysDiff; i >= 0; i--) {
      const weekNumber = Math.floor(i / 7) + 1;
      const dayNumber = (i % 7) + 1;
      if (weekNumber > 4) continue;
      const week = currentPlan.weeks[weekNumber - 1];
      if (!week) continue;
      const day = week.days[dayNumber - 1];
      if (!day || !day.is_workout_day) continue;
      if (day.progress && day.progress.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Build recent activity list from plan data
  const getRecentActivity = () => {
    if (!currentPlan) return [];
    const activities = [];
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    for (let i = daysDiff; i >= 0 && activities.length < 5; i--) {
      const weekNumber = Math.floor(i / 7) + 1;
      const dayNumber = (i % 7) + 1;
      if (weekNumber > 4) continue;
      const week = currentPlan.weeks[weekNumber - 1];
      if (!week) continue;
      const day = week.days[dayNumber - 1];
      if (!day || !day.is_workout_day) continue;

      const daysAgo = daysDiff - i;
      let dateLabel;
      if (daysAgo === 0) dateLabel = 'Today';
      else if (daysAgo === 1) dateLabel = 'Yesterday';
      else dateLabel = `${daysAgo} days ago`;

      const completed = day.progress && day.progress.completed;
      const duration = day.workout?.duration_minutes || 0;
      const type = day.workout?.type || 'Workout';

      activities.push({
        title: `${duration}-min ${type}`,
        date: dateLabel,
        completed,
      });
    }
    return activities;
  };

  const activeMinutes = calculateActiveMinutes();
  const streak = calculateStreak();
  const recentActivity = getRecentActivity();

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progress Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            <Text style={styles.overviewNumber}>{planProgress.completed}/{planProgress.total}</Text>
            <Text style={styles.overviewLabel}>Workouts Done</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="time" size={32} color={colors.success} />
            <Text style={styles.overviewNumber}>{activeMinutes}</Text>
            <Text style={styles.overviewLabel}>Minutes Active</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="trending-up" size={32} color={colors.warning} />
            <Text style={styles.overviewNumber}>{planProgress.percentage}%</Text>
            <Text style={styles.overviewLabel}>Plan Complete</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="flame" size={32} color={colors.error} />
            <Text style={styles.overviewNumber}>{streak}</Text>
            <Text style={styles.overviewLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Adherence Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Adherence</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.chartPlaceholder}>
            {planProgress.percentage}% adherence
          </Text>
          <Text style={styles.chartSubtext}>
            {planProgress.completed} of {planProgress.total} workouts completed
          </Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={activity.completed ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={activity.completed ? colors.success : colors.error}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
                <Text style={styles.activityStatus}>
                  {activity.completed ? 'Completed' : 'Pending'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No workout activity yet. Start a plan to track your progress!</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      web: { boxShadow: `0 2px 4px ${colors.shadow}` },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
    }),
    elevation: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: `0 2px 4px ${colors.shadow}` },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
    }),
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  chartPlaceholder: {
    fontSize: 16,
    color: colors.textMedium,
  },
  chartSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  activityDate: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  activityStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
  noActivityText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
