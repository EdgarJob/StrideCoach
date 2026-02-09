import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';
import { usePlan } from '../contexts/PlanContext';
import { useHealth } from '../contexts/HealthContext';
import WorkoutCalendar from '../components/WorkoutCalendar';
import PremiumBackground from '../components/PremiumBackground';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

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

  // Ensure menu never "sticks" across tab changes (can make other tabs feel blank/unresponsive).
  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowProfileMenu(false);
      };
    }, [])
  );

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

  const navigateFromMenu = (routeName) => {
    setShowProfileMenu(false);
    // Give the modal a beat to dismiss before switching tabs (iOS can glitch otherwise).
    setTimeout(() => navigation.navigate(routeName), 50);
  };

  return (
    <PremiumBackground>
      {/* Header */}
      <LinearGradient
        colors={[colors.textDark, colors.primary]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>Ready for your workout today?</Text>
        </View>
        
        {/* Profile Dropdown Menu */}
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setShowProfileMenu(!showProfileMenu)}
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
        </View>
      </LinearGradient>

      {/* Dropdown Menu (Modal to ensure it renders above ScrollView on all platforms) */}
      <Modal
        transparent
        visible={showProfileMenu}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowProfileMenu(false)}>
          <Pressable
            style={[styles.dropdownMenu, { top: insets.top + 76, right: 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                navigateFromMenu('Profile');
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.textDark} />
              <Text style={styles.dropdownText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                navigateFromMenu('Plans');
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textDark} />
              <Text style={styles.dropdownText}>My Plans</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                navigateFromMenu('Progress');
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
          </Pressable>
        </Pressable>
      </Modal>

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
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.14)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontSize: 28,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    fontFamily: fonts.body,
  },
  progressCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 16,
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
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.display,
    fontWeight: 'normal',
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
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textMedium,
  },
  compactHealthHint: {
    marginLeft: 'auto',
    fontSize: 11,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.primary,
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
