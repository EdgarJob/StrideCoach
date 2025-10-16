import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAICoach } from '../contexts/AICoachContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { dailyMotivation } = useAICoach();

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

  return (
    <ScrollView style={styles.container}>
      {/* Header with Profile and Sign Out Icons */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.subtitle}>Ready for your workout today?</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Progress Ring */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
          <Text style={styles.cardTitle}>This Week's Progress</Text>
        </View>
        <View style={styles.progressRingContainer}>
          <View style={styles.progressRing}>
            <Text style={styles.progressNumber}>4/5</Text>
            <Text style={styles.progressLabel}>Workouts</Text>
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressTitle}>You're crushing it! 🔥</Text>
            <Text style={styles.progressSubtitle}>80% completion rate</Text>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakText}>6-day streak</Text>
            </View>
          </View>
        </View>
      </View>

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

      {/* Today's Workout Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="walk" size={24} color="#4F46E5" />
          <Text style={styles.cardTitle}>Today's Workout</Text>
        </View>
        <Text style={styles.workoutDescription}>
          🚶‍♂️ 60-minute brisk walk
        </Text>
        <Text style={styles.workoutTime}>
          Target: Zone 2 heart rate (120-140 bpm)
        </Text>
        <View style={styles.workoutDetails}>
          <View style={styles.workoutDetail}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.workoutDetailText}>5:00 PM</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.workoutDetailText}>Outdoor</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Ionicons name="thermometer" size={16} color="#6B7280" />
            <Text style={styles.workoutDetailText}>72°F</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Workouts */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={24} color="#F59E0B" />
          <Text style={styles.cardTitle}>Upcoming Workouts</Text>
        </View>
        <View style={styles.upcomingList}>
          <View style={styles.upcomingItem}>
            <View style={styles.upcomingIcon}>
              <Ionicons name="fitness" size={20} color="#4F46E5" />
            </View>
            <View style={styles.upcomingContent}>
              <Text style={styles.upcomingTitle}>30-min Strength</Text>
              <Text style={styles.upcomingDate}>Tomorrow, 6:00 PM</Text>
            </View>
            <Text style={styles.upcomingType}>Strength</Text>
          </View>
          
          <View style={styles.upcomingItem}>
            <View style={styles.upcomingIcon}>
              <Ionicons name="walk" size={20} color="#10B981" />
            </View>
            <View style={styles.upcomingContent}>
              <Text style={styles.upcomingTitle}>45-min Walk</Text>
              <Text style={styles.upcomingDate}>Friday, 5:30 PM</Text>
            </View>
            <Text style={styles.upcomingType}>Walk</Text>
          </View>
        </View>
      </View>

      {/* AI Coach & Motivation */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#4F46E5" />
          <Text style={styles.cardTitle}>AI Coach</Text>
        </View>
        <View style={styles.coachContainer}>
          <View style={styles.coachMessage}>
            <Text style={styles.coachText}>
              "{dailyMotivation || "The only bad workout is the one that didn't happen. You've got this! 💪"}"
            </Text>
            <Text style={styles.coachAuthor}>- Your AI Coach</Text>
          </View>
          <View style={styles.coachActions}>
            <TouchableOpacity 
              style={styles.coachButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Ionicons name="chatbubble" size={16} color="#4F46E5" />
              <Text style={styles.coachButtonText}>Ask Question</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.coachButton}>
              <Ionicons name="refresh" size={16} color="#4F46E5" />
              <Text style={styles.coachButtonText}>New Tip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('progress')}>
            <Ionicons name="bar-chart" size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('settings')}>
            <Ionicons name="settings" size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('plan')}>
            <Ionicons name="fitness" size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Workout Plan</Text>
          </TouchableOpacity>
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
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
});
