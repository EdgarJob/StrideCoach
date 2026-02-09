import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { data as supabaseData } from './supabase';

const toISODate = (date) => date.toISOString().split('T')[0];

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// "Today's sleep" is typically last night's sleep, so we look from yesterday evening to today midday.
const getSleepWindow = (now = new Date()) => {
  const start = startOfDay(now);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);

  const end = startOfDay(now);
  end.setHours(12, 0, 0, 0);

  // Don't query into the future.
  const safeEnd = end > now ? now : end;
  return { start, end: safeEnd };
};

let cachedHealthkit;
const getHealthkitModule = () => {
  if (cachedHealthkit !== undefined) return cachedHealthkit;

  // Expo Go cannot load Nitro modules (HealthKit/Health Connect libraries).
  // Avoid requiring the native module entirely to prevent runtime errors.
  if (Constants?.appOwnership === 'expo') {
    cachedHealthkit = null;
    return cachedHealthkit;
  }

  try {
    // Avoid breaking web builds by requiring only at runtime on iOS.
    // eslint-disable-next-line global-require
    cachedHealthkit = require('@kingstinct/react-native-healthkit');
  } catch (err) {
    cachedHealthkit = null;
  }
  return cachedHealthkit;
};

let cachedHealthConnect;
const getHealthConnectModule = () => {
  if (cachedHealthConnect !== undefined) return cachedHealthConnect;

  // Expo Go cannot load Nitro modules (HealthKit/Health Connect libraries).
  // Avoid requiring the native module entirely to prevent runtime errors.
  if (Constants?.appOwnership === 'expo') {
    cachedHealthConnect = null;
    return cachedHealthConnect;
  }

  try {
    // eslint-disable-next-line global-require
    cachedHealthConnect = require('react-native-health-connect');
  } catch (err) {
    cachedHealthConnect = null;
  }
  return cachedHealthConnect;
};

const IOS_READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKCategoryTypeIdentifierSleepAnalysis',
];

const ANDROID_READ_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ExerciseSession' },
];

const formatHealthError = (err) => {
  const message = err?.message || String(err);
  if (Platform.OS === 'android') {
    if (message.toLowerCase().includes('health connect')) {
      return message;
    }
    return `Health Connect error: ${message}`;
  }
  if (Platform.OS === 'ios') return `Apple Health error: ${message}`;
  return message;
};

const ensureAndroidInitialized = async () => {
  const hc = getHealthConnectModule();
  if (!hc) throw new Error('Health Connect module is not available in this build.');

  // Best-effort: initialize even if Health Connect app is missing; SDK will report status.
  const status = await hc.getSdkStatus?.();
  if (typeof status === 'number' && hc.SdkAvailabilityStatus) {
    if (status !== hc.SdkAvailabilityStatus.SDK_AVAILABLE) {
      throw new Error('Health Connect is not available on this device. Install/enable Health Connect and try again.');
    }
  }

  const ok = await hc.initialize();
  if (!ok) {
    throw new Error('Failed to initialize Health Connect.');
  }
};

const requestAndroidPermissions = async () => {
  const hc = getHealthConnectModule();
  await ensureAndroidInitialized();

  const granted = await hc.requestPermission(ANDROID_READ_PERMISSIONS);
  const grantedKey = (p) => `${p?.accessType}:${p?.recordType}`;
  const grantedSet = new Set((granted || []).map(grantedKey));

  const missing = ANDROID_READ_PERMISSIONS.filter((p) => !grantedSet.has(grantedKey(p)));
  if (missing.length > 0) {
    throw new Error('Health Connect permissions were not granted.');
  }

  return true;
};

const requestIOSPermissions = async () => {
  const hk = getHealthkitModule();
  if (!hk) throw new Error('Apple Health module is not available in this build.');

  const available = (hk.isHealthDataAvailableAsync
    ? await hk.isHealthDataAvailableAsync()
    : hk.isHealthDataAvailable?.());

  if (!available) {
    throw new Error('Apple Health is not available on this device.');
  }

  // Must be called before any reads, otherwise the library can crash.
  const ok = await hk.requestAuthorization({ toRead: IOS_READ_TYPES });
  if (!ok) {
    throw new Error('Apple Health permissions were not granted.');
  }

  return true;
};

const getAndroidTodaySummary = async () => {
  const hc = getHealthConnectModule();
  await ensureAndroidInitialized();

  const now = new Date();
  const dayStart = startOfDay(now).toISOString();
  const dayEnd = now.toISOString();

  const timeRangeFilter = { operator: 'between', startTime: dayStart, endTime: dayEnd };

  let steps = null;
  let activeMinutes = null;
  let heartRate = null;
  let sleepHours = null;

  try {
    const stepsAgg = await hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter });
    steps = Number.isFinite(stepsAgg?.COUNT_TOTAL) ? stepsAgg.COUNT_TOTAL : 0;
  } catch (err) {
    steps = null;
  }

  try {
    const exerciseAgg = await hc.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter });
    const secs = exerciseAgg?.EXERCISE_DURATION_TOTAL?.inSeconds;
    activeMinutes = Number.isFinite(secs) ? Math.round(secs / 60) : 0;
  } catch (err) {
    activeMinutes = null;
  }

  try {
    const hrAgg = await hc.aggregateRecord({ recordType: 'HeartRate', timeRangeFilter });
    heartRate = Number.isFinite(hrAgg?.BPM_AVG) ? Math.round(hrAgg.BPM_AVG) : null;
  } catch (err) {
    heartRate = null;
  }

  try {
    const { start, end } = getSleepWindow(now);
    const sleepRes = await hc.readRecords('SleepSession', {
      timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
      ascendingOrder: true,
      pageSize: 200,
    });

    const sessions = Array.isArray(sleepRes?.records) ? sleepRes.records : Array.isArray(sleepRes?.result) ? sleepRes.result : [];
    const totalMs = sessions.reduce((sum, session) => {
      const startTime = session?.startTime ? new Date(session.startTime) : null;
      const endTime = session?.endTime ? new Date(session.endTime) : null;
      if (!startTime || !endTime || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return sum;
      return sum + Math.max(0, endTime.getTime() - startTime.getTime());
    }, 0);

    sleepHours = totalMs > 0 ? Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10 : 0;
  } catch (err) {
    sleepHours = null;
  }

  return {
    date: toISODate(now),
    steps,
    sleepHours,
    heartRate,
    activeMinutes,
  };
};

const getIOSTodaySummary = async () => {
  const hk = getHealthkitModule();
  if (!hk) throw new Error('Apple Health module is not available in this build.');

  // Safety: make sure authorization has been requested before any reads.
  await requestIOSPermissions();

  const now = new Date();
  const dayStart = startOfDay(now);

  let steps = null;
  let activeMinutes = null;
  let heartRate = null;
  let sleepHours = null;

  try {
    const stats = await hk.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierStepCount',
      ['cumulativeSum'],
      {
        filter: { date: { startDate: dayStart, endDate: now } },
        unit: 'count',
      }
    );
    steps = Number.isFinite(stats?.sumQuantity?.quantity) ? Math.round(stats.sumQuantity.quantity) : 0;
  } catch (err) {
    steps = null;
  }

  try {
    const stats = await hk.queryStatisticsForQuantity(
      'HKQuantityTypeIdentifierAppleExerciseTime',
      ['cumulativeSum'],
      {
        filter: { date: { startDate: dayStart, endDate: now } },
        unit: 'min',
      }
    );
    activeMinutes = Number.isFinite(stats?.sumQuantity?.quantity) ? Math.round(stats.sumQuantity.quantity) : 0;
  } catch (err) {
    activeMinutes = null;
  }

  try {
    const sample = await hk.getMostRecentQuantitySample('HKQuantityTypeIdentifierHeartRate');
    heartRate = Number.isFinite(sample?.quantity) ? Math.round(sample.quantity) : null;
  } catch (err) {
    heartRate = null;
  }

  try {
    const { start, end } = getSleepWindow(now);
    const samples = await hk.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: -1,
      ascending: true,
      filter: { date: { startDate: start, endDate: end } },
    });

    const asleepValues = new Set([1, 3, 4, 5]); // asleepUnspecified/core/deep/REM
    const totalMs = (samples || []).reduce((sum, s) => {
      if (!asleepValues.has(s?.value)) return sum;
      const startDate = s?.startDate ? new Date(s.startDate) : null;
      const endDate = s?.endDate ? new Date(s.endDate) : null;
      if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return sum;
      return sum + Math.max(0, endDate.getTime() - startDate.getTime());
    }, 0);

    sleepHours = totalMs > 0 ? Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10 : 0;
  } catch (err) {
    sleepHours = null;
  }

  return {
    date: toISODate(now),
    steps,
    sleepHours,
    heartRate,
    activeMinutes,
  };
};

export const healthService = {
  isSupported: async () => {
    // Keep the rest of the app usable in Expo Go by disabling native health sync.
    if (Constants?.appOwnership === 'expo') return false;

    if (Platform.OS === 'ios') {
      const hk = getHealthkitModule();
      if (!hk) return false;
      try {
        return hk.isHealthDataAvailableAsync
          ? await hk.isHealthDataAvailableAsync()
          : Boolean(hk.isHealthDataAvailable?.());
      } catch (err) {
        return false;
      }
    }

    if (Platform.OS === 'android') {
      const hc = getHealthConnectModule();
      if (!hc) return false;
      try {
        const status = await hc.getSdkStatus?.();
        if (typeof status !== 'number' || !hc.SdkAvailabilityStatus) return true;
        return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
      } catch (err) {
        return false;
      }
    }

    return false;
  },

  requestPermissions: async () => {
    try {
      if (Constants?.appOwnership === 'expo') {
        return { success: false, error: 'Health sync is not supported in Expo Go. Use a dev build (expo run:* / EAS dev client) to enable it.' };
      }

      if (Platform.OS === 'ios') {
        await requestIOSPermissions();
        return { success: true };
      }

      if (Platform.OS === 'android') {
        await requestAndroidPermissions();
        return { success: true };
      }

      return { success: false, error: 'Health sync is not supported on this platform.' };
    } catch (err) {
      return { success: false, error: formatHealthError(err) };
    }
  },

  getTodaySummary: async () => {
    if (Constants?.appOwnership === 'expo') {
      throw new Error('Health sync is not supported in Expo Go. Use a dev build (expo run:* / EAS dev client) to enable it.');
    }

    if (Platform.OS === 'ios') return await getIOSTodaySummary();
    if (Platform.OS === 'android') return await getAndroidTodaySummary();
    throw new Error('Health sync is not supported on this platform.');
  },

  syncTodayToSupabase: async (userId) => {
    if (!userId) return { success: false, error: 'Missing user id' };
    try {
      const summary = await healthService.getTodaySummary();
      const payload = {
        user_id: userId,
        date: summary.date,
        steps: summary.steps ?? 0,
        active_minutes: summary.activeMinutes ?? 0,
        sleep_hours: summary.sleepHours ?? null,
        heart_rate: summary.heartRate ?? null,
      };

      const { error } = await supabaseData.insertHealthData(payload);
      if (error) throw error;

      return { success: true, summary: payload };
    } catch (err) {
      return { success: false, error: formatHealthError(err) };
    }
  },
};

export default healthService;
