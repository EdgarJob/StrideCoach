import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import cacheService from '../services/cacheService';
import { healthService } from '../services/healthService';
import { useAuth } from './AuthContext';

const HealthContext = createContext(null);

const connectedKeyForUser = (userId) => `health_connected:${userId || 'anonymous'}`;
const healthCacheKeyForUser = (userId) => `health_data:${userId || 'anonymous'}`;

const toCompactK = (value) => {
  if (value === null || value === undefined) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
};

const formatHours = (value) => {
  if (value === null || value === undefined) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `${n.toFixed(1)}h`;
};

export const useHealth = () => {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within a HealthProvider');
  return ctx;
};

export const HealthProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [connected, setConnected] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState(null);
  const [today, setToday] = useState(null);

  const loadConnected = async (uid) => {
    try {
      const raw = await AsyncStorage.getItem(connectedKeyForUser(uid));
      return raw === '1';
    } catch (err) {
      return false;
    }
  };

  const persistConnected = async (uid, nextConnected) => {
    try {
      if (!uid) return;
      if (nextConnected) {
        await AsyncStorage.setItem(connectedKeyForUser(uid), '1');
      } else {
        await AsyncStorage.removeItem(connectedKeyForUser(uid));
      }
    } catch (err) {
      // ignore
    }
  };

  const refresh = async ({ syncToSupabase = true } = {}) => {
    if (!userId) return { success: false, error: 'Not signed in' };
    if (!connected) return { success: false, error: 'Health is not connected' };

    // Web isn't supported; keep this very explicit so web builds won't do anything.
    if (Platform.OS === 'web') return { success: false, error: 'Health sync is not supported on web.' };

    try {
      setLoading(true);
      setError(null);

      const summary = await healthService.getTodaySummary();
      setToday(summary);
      setFromCache(false);

      await cacheService.set(healthCacheKeyForUser(userId), summary, 60 * 60 * 1000);

      if (syncToSupabase) {
        await healthService.syncTodayToSupabase(userId);
      }

      return { success: true, summary };
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    if (!userId) return { success: false, error: 'Not signed in' };

    try {
      setLoading(true);
      setError(null);

      const isSupported = await healthService.isSupported();
      setSupported(isSupported);
      if (!isSupported) {
        throw new Error('Health sync is not available on this device/build. (Requires an EAS dev build, not Expo Go.)');
      }

      const permissionResult = await healthService.requestPermissions();
      if (!permissionResult.success) {
        throw new Error(permissionResult.error || 'Failed to request health permissions.');
      }

      setConnected(true);
      await persistConnected(userId, true);

      // Populate immediately after connect.
      await refresh({ syncToSupabase: true });

      return { success: true };
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!userId) return;
    setConnected(false);
    setToday(null);
    setFromCache(false);
    setError(null);
    await persistConnected(userId, false);
  };

  // Re-evaluate support + load connected flag per user.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        setConnected(false);
        setSupported(false);
        setToday(null);
        setFromCache(false);
        setError(null);
        return;
      }

      const [isSupported, wasConnected] = await Promise.all([
        healthService.isSupported(),
        loadConnected(userId),
      ]);

      if (cancelled) return;
      setSupported(isSupported);
      setConnected(wasConnected);

      const cached = await cacheService.get(healthCacheKeyForUser(userId));
      if (!cancelled && cached) {
        setToday(cached);
        setFromCache(true);
      }

      // If connected, refresh in background (do not block UI).
      if (wasConnected && isSupported && !cancelled) {
        refresh({ syncToSupabase: true });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo(() => ({
    connected,
    supported,
    loading,
    fromCache,
    error,
    today,
    connect,
    disconnect,
    refresh,
    format: {
      steps: (n) => toCompactK(n),
      sleep: (n) => formatHours(n),
      bpm: (n) => (Number.isFinite(Number(n)) ? `${Math.round(Number(n))}` : '--'),
      active: (n) => (Number.isFinite(Number(n)) ? `${Math.round(Number(n))}` : '--'),
    },
  }), [connected, supported, loading, fromCache, error, today]);

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
};
