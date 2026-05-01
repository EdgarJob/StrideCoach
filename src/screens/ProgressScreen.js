import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlan } from '../contexts/PlanContext';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumBackground from '../components/PremiumBackground';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
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
    <PremiumBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom + 16) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Consistency beats intensity.</Text>
      </View>

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
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    color: colors.textDark,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMedium,
    fontFamily: fonts.body,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.10)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 18 },
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textMedium,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.10)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 18 },
    }),
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.textDark,
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.body,
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  chartSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    fontFamily: fonts.body,
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  activityDate: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  activityStatus: {
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.success,
  },
  noActivityText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    paddingVertical: 16,
    fontFamily: fonts.body,
  },
});
