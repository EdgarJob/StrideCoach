import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';
import { usePlan } from '../contexts/PlanContext';
import { useHealth } from '../contexts/HealthContext';
import WorkoutCalendar from '../components/WorkoutCalendar';
import colors from '../theme/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut, profile } = useAuth();
  const { dailyMotivation } = useAICoach();
  const { currentPlan, getTodaysWorkout, getPlanProgress, isFromCache, loadCurrentPlan } = usePlan();
  const { connected: healthConnected, today: todayHealth, loading: healthLoading, format: healthFormat } = useHealth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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

    const planProgress = getPlanProgress();
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.min(Math.floor(daysDiff / 7) + 1, 4);
    const streak = calculateStreak();
    const lastWorkoutDate = getLastWorkoutDate();
    
    return {
      completedWorkouts: planProgress.completed,
      totalWorkouts: planProgress.total,
      streak: streak,
      weekNumber: currentWeekNumber,
      lastWorkoutDate: lastWorkoutDate
    };
  };

  const calculateStreak = () => {
    if (!currentPlan) return 0;
    
    let streak = 0;
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
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
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getLastWorkoutDate = () => {
    if (!currentPlan) return 'Not yet';
    
    const today = new Date();
    const startDate = new Date(currentPlan.start_date);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
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

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    try {
      const { error } = await signOut();
      if (error) {
        setStatusMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const progressData = calculateRealProgressData();
  const healthSteps = healthConnected ? healthFormat.steps(todayHealth?.steps) : '--';
  const healthSleep = healthConnected ? healthFormat.sleep(todayHealth?.sleepHours) : '--';
  const healthBpm = healthConnected ? healthFormat.bpm(todayHealth?.heartRate) : '--';
  const healthActive = healthConnected ? healthFormat.active(todayHealth?.activeMinutes) : '--';

  return (
    <View style={styles.container}>
      {/* Colorful Header with Greeting and Profile Dropdown */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
          <Text style={styles.subtitle}>Ready for your workout today?</Text>
        </View>
        
        {/* Profile Dropdown Menu */}
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setShowProfileMenu(!showProfileMenu)}
            onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color={colors.white} />
            </View>
            <Ionicons 
              name={showProfileMenu ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.white} 
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          
          {/* Dropdown Menu */}
          {showProfileMenu && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Profile');
                }}
              >
                <Ionicons name="person-outline" size={18} color={colors.textDark} />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Plans');
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.textDark} />
                <Text style={styles.dropdownText}>My Plans</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Progress');
                }}
              >
                <Ionicons name="trending-up-outline" size={18} color={colors.textDark} />
                <Text style={styles.dropdownText}>Progress</Text>
              </TouchableOpacity>
              
              <View style={styles.dropdownDivider} />
              
              <TouchableOpacity 
                style={[styles.dropdownItem, styles.logoutItem]}
                onPress={() => {
                  setShowProfileMenu(false);
                  handleSignOut();
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
                <Text style={[styles.dropdownText, styles.logoutText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>

      {/* Modern Progress Dashboard */}
      <View style={styles.progressCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <Ionicons name="analytics" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>This Week's Progress</Text>
            {isFromCache && (
              <View style={styles.cacheIndicator}>
                <Ionicons name="cloud-offline" size={14} color={colors.textLight} />
                <Text style={styles.cacheText}>Offline</Text>
              </View>
            )}
          </View>
          <View style={styles.badgeGroup}>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>Week {progressData.weekNumber}</Text>
            </View>
            {isFromCache && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => loadCurrentPlan(true)}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
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
            <View style={styles.progressDot1} />
            <View style={styles.progressDot2} />
            <View style={styles.progressDot3} />
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
              <Text style={styles.statNumber}>{progressData.completedWorkouts}/{progressData.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color={colors.accent} />
              </View>
              <Text style={styles.statNumber}>{progressData.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color={colors.primary} />
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
        
        {/* Compact Health Stats */}
        <View style={styles.compactHealthSection}>
          <View style={styles.compactHealthHeader}>
            <Ionicons name="pulse" size={16} color={colors.textMedium} />
            <Text style={styles.compactHealthTitle}>Today's Health</Text>
            {!healthConnected && (
              <Text style={styles.compactHealthHint}>Connect in Profile</Text>
            )}
          </View>
          <View style={styles.compactHealthGrid}>
            <View style={styles.compactHealthItem}>
              <Ionicons name="walk" size={14} color={colors.primary} />
              <Text style={styles.compactHealthValue}>{healthSteps}</Text>
              <Text style={styles.compactHealthLabel}>steps</Text>
            </View>
            <View style={styles.compactHealthItem}>
              <Ionicons name="bed" size={14} color={colors.purple} />
              <Text style={styles.compactHealthValue}>{healthSleep}</Text>
              <Text style={styles.compactHealthLabel}>sleep</Text>
            </View>
            <View style={styles.compactHealthItem}>
              <Ionicons name="heart" size={14} color={colors.error} />
              <Text style={styles.compactHealthValue}>{healthBpm}</Text>
              <Text style={styles.compactHealthLabel}>bpm</Text>
            </View>
            <View style={styles.compactHealthItem}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={styles.compactHealthValue}>{healthActive}</Text>
              <Text style={styles.compactHealthLabel}>active</Text>
            </View>
          </View>
          {healthLoading && healthConnected && (
            <Text style={styles.compactHealthStatus}>Updating...</Text>
          )}
        </View>

        {/* AI Coach Motivation Message */}
        <View style={styles.coachMotivation}>
          <View style={styles.coachMessageBubble}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={styles.coachMotivationText}>
              "{dailyMotivation || "The only bad workout is the one that didn't happen. You've got this! 💪"}"
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.askCoachButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Ionicons name="chatbubble" size={16} color={colors.white} />
            <Text style={styles.askCoachButtonText}>Let's chat about your progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workout Calendar - Now Last */}
      {currentPlan ? (
        <View style={styles.calendarCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Your Workout Calendar</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.viewAllText}>View Full Plan</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <WorkoutCalendar plan={currentPlan} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
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
              <Ionicons name="add-circle" size={20} color={colors.white} />
              <Text style={styles.createPlanButtonText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      </ScrollView>

      {/* Status Message */}
      {statusMessage && (
        <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.errorBanner : styles.successBanner]}>
          <Ionicons name={statusMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={statusMessage.type === 'error' ? colors.error : colors.success} />
          <Text style={[styles.statusText, statusMessage.type === 'error' ? styles.errorText : styles.successText]}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Sign Out Confirmation */}
      {showSignOutConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Sign Out</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSignOutConfirm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmSignOut}>
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.primary,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90, 179, 193, 0.2)' },
      default: { shadowColor: '#5AB3C1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
    }),
    elevation: 3,
    zIndex: 1000,
  },
  headerLeft: {
    flex: 1,
  },
  // Profile Dropdown Styles
  headerRight: {
    position: 'relative',
    zIndex: 2000,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
    backgroundColor: colors.white,
  },
  dropdownText: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  logoutItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  logoutText: {
    color: colors.error,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  progressCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    }),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cacheIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  cacheText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  circularProgress: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  progressCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: colors.primary,
  },
  bigPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  percentageLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  progressDot1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressDot2: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  progressDot3: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statsGrid: {
    flex: 1,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
  },
  linearProgressContainer: {
    marginBottom: 20,
  },
  linearProgressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  linearProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
  },
  coachMotivation: {
    gap: 12,
  },
  coachMessageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  coachMotivationText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  askCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  askCoachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Compact Health Stats Styles
  compactHealthSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compactHealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  compactHealthTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMedium,
  },
  compactHealthHint: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  compactHealthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  compactHealthItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  compactHealthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 4,
  },
  compactHealthLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  compactHealthStatus: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textLight,
  },
  calendarCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    }),
    elevation: 3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    }),
    elevation: 3,
  },
  noPlanContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  noPlanText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  createPlanButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  confirmDialog: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
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
  errorText: {
    color: colors.error,
  },
  successText: {
    color: colors.success,
  },
});
