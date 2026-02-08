import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthDataConnected, setHealthDataConnected] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const { user, profile, signOut } = useAuth();

  // Helper to format height from cm to feet/inches
  const formatHeight = (cm) => {
    if (!cm) return '--';
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  // Helper to format weight from kg to lbs
  const formatWeight = (kg) => {
    if (!kg) return '--';
    return `${Math.round(kg * 2.205)} lbs`;
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

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.user_metadata?.display_name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      {/* Health Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatHeight(profile?.height_cm)}</Text>
            <Text style={styles.statLabel}>Height</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatWeight(profile?.weight_kg)}</Text>
            <Text style={styles.statLabel}>Current Weight</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatWeight(profile?.goal?.target_weight)}</Text>
            <Text style={styles.statLabel}>Goal Weight</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.age ?? '--'}</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Workout reminders</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.inputBorder, true: colors.primary }}
            thumbColor={notificationsEnabled ? colors.white : colors.borderLight}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="fitness" size={24} color={colors.success} />
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
            <Ionicons name="time" size={24} color={colors.warning} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Workout Time</Text>
              <Text style={styles.settingSubtitle}>5:00 PM</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
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

      {/* Status Message */}
      {statusMessage && (
        <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.errorBanner : styles.successBanner]}>
          <Ionicons name={statusMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={statusMessage.type === 'error' ? colors.error : colors.success} />
          <Text style={[styles.statusText, statusMessage.type === 'error' ? styles.errorText : styles.successText]}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    backgroundColor: colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.indigo,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.indigo,
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
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    color: colors.textDark,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
  },
  connectButtonConnected: {
    backgroundColor: colors.success,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  connectButtonTextConnected: {
    color: colors.white,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.textBody,
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textBody,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textMedium,
  },
  signOutButton: {
    backgroundColor: colors.error,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
