import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';
import { usePlan } from '../contexts/PlanContext';
import WorkoutCalendar from '../components/WorkoutCalendar';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { profile, signOut } = useAuth();
  const { dailyMotivation } = useAICoach();
  const { currentPlan, getTodaysWorkout, getPlanProgress } = usePlan();

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
        return checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const completionPercentage = progressData.totalWorkouts > 0 
    ? Math.round((progressData.completedWorkouts / progressData.totalWorkouts) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Light Blue Gradient Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hi, {profile?.display_name || 'Athlete'}! 👋</Text>
              <View style={styles.levelBadge}>
                <Ionicons name="star" size={12} color="#FF9500" />
                <Text style={styles.levelText}>Lv {Math.floor(progressData.completedWorkouts / 7) + 1}</Text>
                <Text style={styles.levelDot}>•</Text>
                <Ionicons name="trophy" size={12} color="#FF9500" />
                <Text style={styles.levelText}>Beginner</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={40} color="#5AB3C1" />
            </TouchableOpacity>
          </View>

          {/* Fitness Mascot Character */}
          <View style={styles.mascotContainer}>
            <View style={styles.mascotCircle}>
              <Text style={styles.mascotEmoji}>🏃‍♂️</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        {/* Ready to Start Card - Primary CTA */}
        {currentPlan && (
          <TouchableOpacity 
            style={styles.ctaCard}
            onPress={() => navigation.navigate('Plans')}
            activeOpacity={0.9}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaTitle}>Ready to Start</Text>
                <Text style={styles.ctaSubtitle}>Your Challenge</Text>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Next</Text>
                </View>
              </View>
              <View style={styles.ctaRight}>
                <Text style={styles.ctaIcon}>💪</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Access Grid */}
        <View style={styles.quickAccessGrid}>
          {/* Plans Card */}
          <TouchableOpacity 
            style={styles.quickCard}
            onPress={() => navigation.navigate('Plans')}
          >
            <View style={styles.quickIconContainer}>
              <Ionicons name="calendar" size={28} color="#5AB3C1" />
            </View>
            <Text style={styles.quickCardTitle}>Plans</Text>
          </TouchableOpacity>

          {/* Progress Card */}
          <TouchableOpacity 
            style={styles.quickCard}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={styles.quickIconContainer}>
              <Ionicons name="trending-up" size={28} color="#5AB3C1" />
            </View>
            <Text style={styles.quickCardTitle}>Progress</Text>
          </TouchableOpacity>
        </View>

        {/* AI Coach Card */}
        <TouchableOpacity 
          style={styles.coachCard}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.9}
        >
          <View style={styles.coachContent}>
            <View style={styles.coachIconWrapper}>
              <Text style={styles.coachIcon}>🤖</Text>
            </View>
            <View style={styles.coachTextContent}>
              <Text style={styles.coachTitle}>AI Coach</Text>
              <Text style={styles.coachSubtitle} numberOfLines={2}>
                {dailyMotivation || "I'm here to help you reach your goals!"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5AB3C1" />
          </View>
        </TouchableOpacity>

        {/* Stats Overview Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {/* Workouts Completed */}
            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#FFF3CD' }]}>
                <Ionicons name="checkmark-circle" size={22} color="#FF9500" />
              </View>
              <Text style={styles.statNumber}>{progressData.completedWorkouts}</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <View style={styles.statProgressBar}>
                <View style={[styles.statProgressFill, { width: `${Math.min(completionPercentage, 100)}%` }]} />
              </View>
              <Text style={styles.statPercentage}>{completionPercentage}%</Text>
            </View>

            {/* Streak */}
            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#FFE5E5' }]}>
                <Ionicons name="flame" size={22} color="#FF4444" />
              </View>
              <Text style={styles.statNumber}>{progressData.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
              <View style={styles.statProgressBar}>
                <View style={[styles.statProgressFill, { width: `${Math.min((progressData.streak / 7) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.statPercentage}>{progressData.streak}/7</Text>
            </View>

            {/* Badge */}
            <View style={styles.statItem}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#E5F3FF' }]}>
                <Ionicons name="trophy" size={22} color="#5AB3C1" />
              </View>
              <Text style={styles.statNumber}>{Math.floor(progressData.completedWorkouts / 7) + 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
              <View style={styles.statProgressBar}>
                <View style={[styles.statProgressFill, { width: '60%' }]} />
              </View>
              <Text style={styles.statPercentage}>60%</Text>
            </View>
          </View>
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>Achievements</Text>
            <View style={styles.achievementBadgeWrapper}>
              <Ionicons name="trophy" size={14} color="#FF9500" />
              <Text style={styles.achievementsCount}>3/12</Text>
            </View>
          </View>
          
          <View style={styles.achievementsList}>
            <View style={styles.achievementBadge}>
              <View style={styles.achievementBadgeCircle}>
                <Text style={styles.badgeEmoji}>1️⃣</Text>
              </View>
              <Text style={styles.badgeName}>First Steps</Text>
            </View>
            
            <View style={styles.achievementBadge}>
              <View style={styles.achievementBadgeCircle}>
                <Text style={styles.badgeEmoji}>5️⃣</Text>
              </View>
              <Text style={styles.badgeName}>5 Day Streak</Text>
            </View>
            
            <View style={[styles.achievementBadge, styles.lockedBadge]}>
              <View style={[styles.achievementBadgeCircle, styles.lockedCircle]}>
                <Ionicons name="lock-closed" size={24} color="#D1D5DB" />
              </View>
              <Text style={[styles.badgeName, styles.lockedText]}>Unlocked</Text>
            </View>
          </View>
        </View>

        {/* Workout Calendar */}
        {currentPlan ? (
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Your Workout Plan</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Plans')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <WorkoutCalendar plan={currentPlan} />
          </View>
        ) : (
          <View style={styles.noPlanCard}>
            <Text style={styles.noPlanIcon}>📅</Text>
            <Text style={styles.noPlanTitle}>No Active Plan</Text>
            <Text style={styles.noPlanText}>
              Start your fitness journey with a personalized plan!
            </Text>
            <TouchableOpacity 
              style={styles.createPlanButton}
              onPress={() => navigation.navigate('Plans')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createPlanButtonText}>Create Your Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  headerGradient: {
    backgroundColor: '#D4EFFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  levelDot: {
    color: '#9CA3AF',
    fontSize: 12,
    marginHorizontal: 6,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mascotEmoji: {
    fontSize: 60,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  ctaCard: {
    backgroundColor: '#5AB3C1',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaLeft: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5AB3C1',
  },
  ctaRight: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 48,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  quickIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  coachContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  coachIcon: {
    fontSize: 32,
  },
  coachTextContent: {
    flex: 1,
    marginRight: 12,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  coachSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statProgressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 3,
  },
  statPercentage: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  achievementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  achievementBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    flex: 1,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.6,
  },
  achievementBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedCircle: {
    backgroundColor: '#F3F4F6',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5AB3C1',
  },
  noPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  noPlanIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
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
    backgroundColor: '#FF9500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createPlanButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
