import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';
import { usePlan } from '../contexts/PlanContext';
import WorkoutCalendar from '../components/WorkoutCalendar';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { dailyMotivation, loadDailyMotivation } = useAICoach();
  const { currentPlan, getTodaysWorkout, getPlanProgress } = usePlan();

  // Load AI motivation with real progress data when component mounts or plan changes
  useEffect(() => {
    if (currentPlan) {
      // Calculate real progress data
      const progressData = calculateRealProgressData();
      loadDailyMotivation(progressData);
    } else {
      // Load without progress data if no plan exists
      loadDailyMotivation({});
    }
  }, [currentPlan]); // Removed loadDailyMotivation from dependencies since it's now memoized

  // Calculate real progress data from current plan
  const calculateRealProgressData = () => {
    if (!currentPlan) {
      return {
        completedWorkouts: 0,
        totalWorkouts: 0,
        streak: 0,
        weekNumber: 1,
        lastWorkoutDate: 'Not yet'
      };
    }

    // Get plan progress using existing function
    const planProgress = getPlanProgress();
    
    // Calculate current week number
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.min(Math.floor(daysDiff / 7) + 1, 4);
    
    // Calculate streak (consecutive completed workouts from most recent)
    const streak = calculateStreak();
    
    // Get last workout date
    const lastWorkoutDate = getLastWorkoutDate();
    
    return {
      completedWorkouts: planProgress.completed,
      totalWorkouts: planProgress.total,
      streak: streak,
      weekNumber: currentWeekNumber,
      lastWorkoutDate: lastWorkoutDate
    };
  };

  // Calculate consecutive completed workouts streak
  const calculateStreak = () => {
    if (!currentPlan) return 0;
    
    let streak = 0;
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    // Check backwards from today to find consecutive completed workouts
    for (let i = daysDiff; i >= 0; i--) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      const weekNumber = Math.floor(i / 7) + 1;
      const dayNumber = (i % 7) + 1;
      
      if (weekNumber > 4) continue; // Plan completed
      
      const week = currentPlan.weeks[weekNumber - 1];
      if (!week) continue;
      
      const day = week.days[dayNumber - 1];
      if (!day || !day.is_workout_day) continue;
      
      if (day.progress && day.progress.completed) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  };

  // Get the last workout date
  const getLastWorkoutDate = () => {
    if (!currentPlan) return 'Not yet';
    
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    // Look backwards from today to find the last completed workout
    for (let i = daysDiff; i >= 0; i--) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      const weekNumber = Math.floor(i / 7) + 1;
      const dayNumber = (i % 7) + 1;
      
      if (weekNumber > 4) continue;
      
      const week = currentPlan.weeks[weekNumber - 1];
      if (!week) continue;
      
      const day = week.days[dayNumber - 1];
      if (!day || !day.is_workout_day) continue;
      
      if (day.progress && day.progress.completed) {
        const daysAgo = daysDiff - i;
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return 'Yesterday';
        if (daysAgo < 7) return `${daysAgo} days ago`;
        return checkDate.toLocaleDateString();
      }
    }
    
    return 'Not yet';
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'progress':
        navigation.navigate('Progress');
        break;
      case 'settings':
        navigation.navigate('Profile');
        break;
      case 'plan':
        Alert.alert('Workout Plan', 'This feature will be available soon!');
        break;
      default:
        break;
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    
    if (confirmed) {
      try {
        const { error } = await signOut();
        if (error) {
          alert('Failed to sign out. Please try again.');
        }
      } catch (err) {
        console.error('Sign out error:', err);
        alert('Failed to sign out. Please try again.');
      }
    }
  };

  // Calculate real progress data for display
  const progressData = calculateRealProgressData();

  return (
    <ScrollView style={styles.container}>
      {/* Enhanced Header with Modern Buttons */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.subtitle}>Ready for your workout today?</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.modernHeaderButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={20} color="#4F46E5" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modernHeaderButton} 
            onPress={handleSignOut}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Progress Dashboard */}
      <View style={styles.progressCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <Ionicons name="analytics" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>This Week's Progress</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>Week {progressData.weekNumber}</Text>
          </View>
        </View>

        {/* Visual Progress Bar with Stats */}
        <View style={styles.progressVisualization}>
          {/* Circular Progress Indicator */}
          <View style={styles.circularProgress}>
            <View style={styles.progressCircleOuter}>
              <View style={styles.progressCircleInner}>
                <Text style={styles.bigPercentage}>{progressData.totalWorkouts > 0 ? Math.round((progressData.completedWorkouts / progressData.totalWorkouts) * 100) : 0}%</Text>
                <Text style={styles.percentageLabel}>Complete</Text>
              </View>
            </View>
            {/* Animated dots around circle */}
            <View style={styles.progressDot1} />
            <View style={styles.progressDot2} />
            <View style={styles.progressDot3} />
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{progressData.completedWorkouts}/{progressData.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{progressData.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statNumber}>{Math.max(0, progressData.totalWorkouts - progressData.completedWorkouts)}</Text>
              <Text style={styles.statLabel}>Left</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.linearProgressContainer}>
          <View style={styles.linearProgressBackground}>
            <View style={[styles.linearProgressFill, { 
              width: progressData.totalWorkouts > 0 ? `${Math.round((progressData.completedWorkouts / progressData.totalWorkouts) * 100)}%` : '0%' 
            }]} />
          </View>
          <Text style={styles.progressPercentText}>
            {progressData.totalWorkouts > 0 ? Math.round((progressData.completedWorkouts / progressData.totalWorkouts) * 100) : 0}% to weekly goal
          </Text>
        </View>
        
        {/* AI Coach Motivation Message */}
        <View style={styles.coachMotivation}>
          <View style={styles.coachMessageBubble}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#4F46E5" />
            <Text style={styles.coachMotivationText}>
              "{dailyMotivation || "The only bad workout is the one that didn't happen. You've got this! 💪"}"
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.askCoachButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
            <Text style={styles.askCoachButtonText}>Let's chat about your progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workout Calendar */}
      {currentPlan ? (
        <View style={styles.calendarCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>Your Workout Calendar</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.viewAllText}>View Full Plan</Text>
              <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          <WorkoutCalendar plan={currentPlan} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>No Active Plan</Text>
          </View>
          <View style={styles.noPlanContent}>
            <Text style={styles.noPlanText}>
              Start your fitness journey with a personalized 4-week plan!
            </Text>
            <TouchableOpacity 
              style={styles.createPlanButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createPlanButtonText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Today's Health Snapshot */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="pulse" size={24} color="#EF4444" />
          <Text style={styles.cardTitle}>Today's Health</Text>
        </View>
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <Ionicons name="walk" size={20} color="#4F46E5" />
            <Text style={styles.healthNumber}>8,420</Text>
            <Text style={styles.healthLabel}>Steps</Text>
            <Text style={styles.healthTarget}>/ 10,000</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="bed" size={20} color="#8B5CF6" />
            <Text style={styles.healthNumber}>7.2h</Text>
            <Text style={styles.healthLabel}>Sleep</Text>
            <Text style={styles.healthTarget}>Good</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="heart" size={20} color="#EF4444" />
            <Text style={styles.healthNumber}>62</Text>
            <Text style={styles.healthLabel}>Resting HR</Text>
            <Text style={styles.healthTarget}>Excellent</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="time" size={20} color="#10B981" />
            <Text style={styles.healthNumber}>45</Text>
            <Text style={styles.healthLabel}>Active Min</Text>
            <Text style={styles.healthTarget}>/ 60</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernHeaderButton: {
    padding: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  // Modern Progress Card Styles
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 6,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  // Progress Visualization Styles
  progressVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  circularProgress: {
    position: 'relative',
    marginRight: 16,
  },
  progressCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#4F46E5',
  },
  progressCircleInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4F46E5',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressDot1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  progressDot2: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  progressDot3: {
    position: 'absolute',
    top: 50,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  statsGrid: {
    flex: 1,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  statIconContainer: {
    marginRight: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Linear Progress Bar Styles
  linearProgressContainer: {
    marginBottom: 20,
  },
  linearProgressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  linearProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderRadius: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  // Weekly Progress Ring Styles
  progressRingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    borderWidth: 4,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  progressLabel: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  progressDetails: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Health Snapshot Styles
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  healthNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  healthTarget: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Workout Card Styles
  workoutDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  workoutTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Upcoming Workouts Styles
  upcomingList: {
    marginTop: 8,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  upcomingDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upcomingType: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // AI Coach Styles
  coachContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  coachMessage: {
    marginBottom: 16,
  },
  coachText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  coachAuthor: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  coachActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  coachButtonText: {
    marginLeft: 6,
    color: '#4F46E5',
    fontWeight: '500',
    fontSize: 14,
  },
  // Quick Actions Styles
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#4F46E5',
    fontWeight: '500',
  },
  // Plan Styles
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginRight: 4,
  },
  planContent: {
    marginTop: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  planProgress: {
    marginTop: 8,
  },
  planProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  planProgressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  todaysWorkout: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  todaysWorkoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  todaysWorkoutType: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginBottom: 2,
  },
  todaysWorkoutDifficulty: {
    fontSize: 12,
    color: '#6B7280',
  },
  noPlanContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPlanText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  createPlanButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // AI Coach Motivation in Progress Card
  coachMotivation: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  coachMessageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  coachMotivationText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4F46E5',
    lineHeight: 20,
  },
  askCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  askCoachButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
