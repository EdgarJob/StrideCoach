import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useHealth } from '../contexts/HealthContext';
import PremiumBackground from '../components/PremiumBackground';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const { user, profile, signOut } = useAuth();
  const { connected: healthDataConnected, loading: healthLoading, connect: connectHealth, disconnect: disconnectHealth } = useHealth();

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

  const handleHealthConnectPress = async () => {
    if (healthLoading) return;

    if (healthDataConnected) {
      await disconnectHealth();
      setStatusMessage({ type: 'success', text: 'Health data disconnected.' });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const result = await connectHealth();
    if (!result.success) {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to connect health data.' });
      setTimeout(() => setStatusMessage(null), 4500);
      return;
    }

    setStatusMessage({ type: 'success', text: 'Health data connected.' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <PremiumBackground>
      <View style={styles.root}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom + 16) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.textDark, colors.primary]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}
          >
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={34} color={colors.white} />
                </View>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.userName}>{user?.user_metadata?.display_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              </View>
            </View>

            <View style={styles.profileChips}>
              <View style={[styles.chip, healthDataConnected ? styles.chipOn : styles.chipOff]}>
                <Ionicons
                  name={healthDataConnected ? 'heart' : 'heart-outline'}
                  size={14}
                  color={colors.white}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.chipText}>
                  {healthDataConnected ? 'Health Connected' : 'Health Not Connected'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Health Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Body Stats</Text>
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
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryAlpha20 }]}>
                  <Ionicons name="notifications" size={18} color={colors.primary} />
                </View>
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
                <View style={[styles.settingIcon, { backgroundColor: colors.accentAlpha14 }]}>
                  <Ionicons name="fitness" size={18} color={colors.accent} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Health Data</Text>
                  <Text style={styles.settingSubtitle}>Apple Health / Health Connect</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  healthDataConnected && styles.connectButtonConnected,
                ]}
                onPress={handleHealthConnectPress}
                disabled={healthLoading}
              >
                <Text
                  style={[
                    styles.connectButtonText,
                    healthDataConnected && styles.connectButtonTextConnected,
                  ]}
                >
                  {healthLoading ? 'Working...' : (healthDataConnected ? 'Connected' : 'Connect')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                  <Ionicons name="time" size={18} color={colors.warning} />
                </View>
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

          {/* App Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>App Information</Text>

            <TouchableOpacity style={styles.infoItem}>
              <Text style={styles.infoLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Text style={styles.infoLabel}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem}>
              <Text style={styles.infoLabel}>Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <View style={[styles.infoItem, styles.infoItemLast]}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          {/* Status Message */}
          {statusMessage && (
            <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.errorBanner : styles.successBanner]}>
              <Ionicons
                name={statusMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={18}
                color={statusMessage.type === 'error' ? colors.error : colors.success}
              />
              <Text style={[styles.statusText, statusMessage.type === 'error' ? styles.errorText : styles.successText]}>
                {statusMessage.text}
              </Text>
            </View>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

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
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 12,
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: colors.headerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 22,
    fontFamily: fonts.title,
    fontWeight: 'normal',
    color: colors.white,
    letterSpacing: -0.2,
  },
  userEmail: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.82)',
    fontFamily: fonts.body,
  },
  profileChips: {
    marginTop: 14,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.headerBorder,
    backgroundColor: colors.headerOverlay,
  },
  chipOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  chipOff: {
    backgroundColor: colors.headerOverlay,
  },
  chipText: {
    fontSize: 12,
    color: colors.white,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.10)' },
      default: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 18 },
    }),
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.title,
    fontWeight: 'normal',
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
    fontSize: 22,
    fontFamily: fonts.display,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.textDark,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  connectButtonConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    color: colors.white,
  },
  connectButtonTextConnected: {
    color: colors.success,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textBody,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textMedium,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
  },
  signOutButton: {
    backgroundColor: colors.error,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
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
    fontFamily: fonts.emphasis,
    fontWeight: 'normal',
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
  },
  successText: {
    color: colors.success,
  },
});
