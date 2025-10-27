import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthDataConnected, setHealthDataConnected] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('Sign out button pressed');
    
    // Use window.confirm for web compatibility
    const confirmed = window.confirm('Are you sure you want to sign out?');
    
    if (confirmed) {
      console.log('User confirmed sign out');
      try {
        const { error } = await signOut();
        console.log('Sign out result:', { error });
        if (error) {
          alert('Failed to sign out. Please try again.');
        } else {
          console.log('Sign out successful, user should be redirected to login');
        }
      } catch (err) {
        console.error('Sign out error:', err);
        alert('Failed to sign out. Please try again.');
      }
    } else {
      console.log('User cancelled sign out');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#5AB3C1" />
        </View>
        <Text style={styles.userName}>{user?.user_metadata?.display_name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      {/* Health Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5'10"</Text>
            <Text style={styles.statLabel}>Height</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>175 lbs</Text>
            <Text style={styles.statLabel}>Current Weight</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>170 lbs</Text>
            <Text style={styles.statLabel}>Goal Weight</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color="#5AB3C1" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Workout reminders</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#5AB3C1' }}
            thumbColor={notificationsEnabled ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="fitness" size={24} color="#10B981" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Health Data</Text>
              <Text style={styles.settingSubtitle}>Apple Health / Google Fit</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[
              styles.connectButton,
              healthDataConnected && styles.connectButtonConnected
            ]}
            onPress={() => setHealthDataConnected(!healthDataConnected)}
          >
            <Text style={[
              styles.connectButtonText,
              healthDataConnected && styles.connectButtonTextConnected
            ]}>
              {healthDataConnected ? 'Connected' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Workout Time</Text>
              <Text style={styles.settingSubtitle}>5:00 PM</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Removed workout preferences summary to keep preferences managed only from Plans */}

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Information</Text>
        
        <TouchableOpacity style={styles.infoItem}>
          <Text style={styles.infoLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.infoItem}>
          <Text style={styles.infoLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.infoItem}>
          <Text style={styles.infoLabel}>Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileHeader: {
    backgroundColor: '#5AB3C1',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  connectButtonConnected: {
    backgroundColor: '#10B981',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5AB3C1',
  },
  connectButtonTextConnected: {
    color: '#FFFFFF',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
