import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Modern Header with Gradient Background */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hi, {profile?.display_name || 'Athlete'}! 👋</Text>
              <View style={styles.levelBadge}>
                <Ionicons name="trophy" size={14} color="#FFF" />
                <Text style={styles.levelText}>Level {Math.floor(progressData.completedWorkouts / 7) + 1}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Fitness Mascot Character */}
          <View style={styles.mascotContainer}>
            <Text style={styles.mascotEmoji}>🏃‍♂️</Text>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>Keep pushing!</Text>
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
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <View style={styles.ctaLeft}>
                  <Text style={styles.ctaTitle}>Ready to Start</Text>
                  <Text style={styles.ctaSubtitle}>Your Challenge</Text>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                  </View>
                </View>
                <View style={styles.ctaRight}>
                  <Text style={styles.ctaIcon}>💪</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Access Grid */}
        <View style={styles.quickAccessGrid}>
          {/* Plans Card */}
          <TouchableOpacity 
            style={[styles.quickCard, styles.plansCard]}
            onPress={() => navigation.navigate('Plans')}
          >
            <View style={styles.quickIconContainer}>
              <Text style={styles.quickIcon}>📋</Text>
            </View>
            <Text style={styles.quickCardTitle}>Plans</Text>
          </TouchableOpacity>

          {/* Progress Card */}
          <TouchableOpacity 
            style={[styles.quickCard, styles.progressCard]}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={styles.quickIconContainer}>
              <Text style={styles.quickIcon}>📊</Text>
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
          <LinearGradient
            colors={['#34D399', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coachGradient}
          >
            <View style={styles.coachContent}>
              <View style={styles.coachLeft}>
                <Text style={styles.coachIcon}>🤖</Text>
              </View>
              <View style={styles.coachRight}>
                <Text style={styles.coachTitle}>AI Coach</Text>
                <Text style={styles.coachSubtitle}>
                  {dailyMotivation || "I'm here to help you reach your goals!"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Overview Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {/* Workouts Completed */}
            <View style={[styles.statItem, { backgroundColor: '#FEF3C7' }]}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{progressData.completedWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts Done</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: `${Math.min(completionPercentage, 100)}%`, backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            {/* Streak */}
            <View style={[styles.statItem, { backgroundColor: '#FEE2E2' }]}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="flame" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{progressData.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: `${Math.min((progressData.streak / 7) * 100, 100)}%`, backgroundColor: '#EF4444' }]} />
              </View>
            </View>

            {/* Points/Badges */}
            <View style={[styles.statItem, { backgroundColor: '#E0E7FF' }]}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={24} color="#6366F1" />
              </View>
              <Text style={styles.statNumber}>{completionPercentage}</Text>
              <Text style={styles.statLabel}>Completion %</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: `${completionPercentage}%`, backgroundColor: '#6366F1' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>Achievements</Text>
            <Text style={styles.achievementsCount}>3/12</Text>
          </View>
          <View style={styles.achievementsList}>
            <View style={styles.achievementBadge}>
              <Text style={styles.badgeEmoji}>🌟</Text>
              <Text style={styles.badgeName}>First Steps</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.badgeEmoji}>🔥</Text>
              <Text style={styles.badgeName}>On Fire</Text>
            </View>
            <View style={[styles.achievementBadge, styles.lockedBadge]}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgeName}>Champion</Text>
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
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  mascotEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  ctaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaGradient: {
    padding: 24,
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
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
  },
  ctaRight: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  plansCard: {
    backgroundColor: '#DBEAFE',
  },
  progressCard: {
    backgroundColor: '#FECACA',
  },
  quickIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickIcon: {
    fontSize: 32,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  coachCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachGradient: {
    padding: 20,
  },
  coachContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachLeft: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  coachIcon: {
    fontSize: 32,
  },
  coachRight: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  coachSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  statProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: 2,
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
  achievementsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementBadge: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
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
    color: '#6366F1',
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
    backgroundColor: '#6366F1',
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
