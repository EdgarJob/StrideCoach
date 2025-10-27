import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';
import { usePlan } from '../contexts/PlanContext';
import WorkoutCalendar from '../components/WorkoutCalendar';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { signOut, profile } = useAuth();
  const { dailyMotivation } = useAICoach();
  const { currentPlan, getTodaysWorkout, getPlanProgress } = usePlan();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

  const progressData = calculateRealProgressData();

  return (
    <View style={styles.container}>
      {/* Colorful Header with Greeting and Profile Dropdown */}
      <View style={styles.header}>
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
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <Ionicons 
              name={showProfileMenu ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#FFFFFF" 
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
                <Ionicons name="person-outline" size={18} color="#1F2937" />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Plans');
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#1F2937" />
                <Text style={styles.dropdownText}>My Plans</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Progress');
                }}
              >
                <Ionicons name="trending-up-outline" size={18} color="#1F2937" />
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
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
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
            <Ionicons name="analytics" size={24} color="#5AB3C1" />
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
                <Ionicons name="flame" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statNumber}>{progressData.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#5AB3C1" />
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
            <Ionicons name="chatbubble-ellipses" size={20} color="#5AB3C1" />
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
            <Ionicons name="calendar" size={24} color="#5AB3C1" />
            <Text style={styles.cardTitle}>Your Workout Calendar</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.viewAllText}>View Full Plan</Text>
              <Ionicons name="chevron-forward" size={16} color="#5AB3C1" />
            </TouchableOpacity>
          </View>
          <WorkoutCalendar plan={currentPlan} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#5AB3C1" />
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
            <Ionicons name="walk" size={20} color="#5AB3C1" />
            <Text style={styles.healthNumber}>8,420</Text>
            <Text style={styles.healthLabel}>Steps</Text>
            <Text style={styles.healthTarget}>/ 10,000</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="bed" size={20} color="#5AB3C1" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#5AB3C1',
    boxShadow: '0px 2px 8px rgba(90, 179, 193, 0.2)',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  logoutItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  logoutText: {
    color: '#EF4444',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
    color: '#1F2937',
  },
  weekBadge: {
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5AB3C1',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#5AB3C1',
  },
  bigPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5AB3C1',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressDot1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5AB3C1',
  },
  progressDot2: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
  progressDot3: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  linearProgressContainer: {
    marginBottom: 20,
  },
  linearProgressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  linearProgressFill: {
    height: '100%',
    backgroundColor: '#5AB3C1',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: '#E5F3FF',
    borderRadius: 12,
  },
  coachMotivationText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  askCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FF9500',
    borderRadius: 12,
  },
  askCoachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
    color: '#5AB3C1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  noPlanContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  noPlanText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#FF9500',
    borderRadius: 12,
  },
  createPlanButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  healthItem: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  healthNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  healthTarget: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
