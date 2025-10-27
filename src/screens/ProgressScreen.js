import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progress Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Ionicons name="walk" size={32} color="#5AB3C1" />
            <Text style={styles.overviewNumber}>24.5</Text>
            <Text style={styles.overviewLabel}>Miles Walked</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="time" size={32} color="#10B981" />
            <Text style={styles.overviewNumber}>180</Text>
            <Text style={styles.overviewLabel}>Minutes Active</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="trending-up" size={32} color="#F59E0B" />
            <Text style={styles.overviewNumber}>-2.1</Text>
            <Text style={styles.overviewLabel}>Weight (lbs)</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="flame" size={32} color="#EF4444" />
            <Text style={styles.overviewNumber}>12</Text>
            <Text style={styles.overviewLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Adherence Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Adherence</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.chartPlaceholder}>
            📊 Chart will be implemented here
          </Text>
          <Text style={styles.chartSubtext}>
            Weekly adherence: 75%
          </Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>60-min Walk</Text>
              <Text style={styles.activityDate}>Yesterday, 5:00 PM</Text>
            </View>
            <Text style={styles.activityStatus}>Completed</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>30-min Strength</Text>
              <Text style={styles.activityDate}>2 days ago, 6:00 PM</Text>
            </View>
            <Text style={styles.activityStatus}>Completed</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>45-min Walk</Text>
              <Text style={styles.activityDate}>3 days ago, 5:30 PM</Text>
            </View>
            <Text style={styles.activityStatus}>Skipped</Text>
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
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#5AB3C1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  chartPlaceholder: {
    fontSize: 16,
    color: '#6B7280',
  },
  chartSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  activityStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});
