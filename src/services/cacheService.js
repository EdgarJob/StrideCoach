/**
 * Cache Service - Manages offline data storage using AsyncStorage
 * 
 * PURPOSE:
 * - Store workout plans locally so users can access them offline
 * - Cache user profile data to reduce API calls
 * - Improve app performance with instant data loading
 * 
 * HOW IT WORKS:
 * 1. Data is stored as JSON strings in AsyncStorage (like cookies in a browser)
 * 2. Each cached item has an expiration time (TTL = Time To Live)
 * 3. When you request cached data, it checks if it's still fresh or expired
 * 4. Expired data is automatically removed
 * 
 * ANALOGY:
 * Think of this like a refrigerator:
 * - You store food (data) with an expiration date
 * - When you want food, you check if it's still fresh
 * - If it's expired, you throw it away and get fresh food
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache Keys - Like labels on containers in your fridge
const CACHE_KEYS = {
  WORKOUT_PLAN: 'workout_plan',           // Current workout plan
  USER_PROFILE: 'user_profile',           // User's profile data
  DAILY_MOTIVATION: 'daily_motivation',   // Today's motivation message
  HEALTH_DATA: 'health_data',             // Health stats
  PREFERENCES: 'preferences',             // User preferences
};

// Cache Expiration Times (in milliseconds)
// 1000ms = 1 second, 60000ms = 1 minute, 3600000ms = 1 hour
const CACHE_DURATION = {
  WORKOUT_PLAN: 7 * 24 * 60 * 60 * 1000,      // 7 days (plans change weekly)
  USER_PROFILE: 24 * 60 * 60 * 1000,          // 1 day (profile rarely changes)
  DAILY_MOTIVATION: 24 * 60 * 60 * 1000,      // 1 day (new motivation daily)
  HEALTH_DATA: 60 * 60 * 1000,                // 1 hour (health data updates frequently)
  PREFERENCES: 30 * 24 * 60 * 60 * 1000,      // 30 days (preferences rarely change)
};

/**
 * CacheService Class - Manages all caching operations
 */
class CacheService {
  /**
   * SET CACHE - Store data with expiration time
   * 
   * @param {string} key - What to call this cached data (e.g., 'workout_plan')
   * @param {any} value - The actual data to store (will be converted to JSON)
   * @param {number} ttl - Time To Live in milliseconds (how long until it expires)
   * 
   * EXAMPLE:
   * await cacheService.set('workout_plan', myPlan, 7 * 24 * 60 * 60 * 1000);
   * // Stores the plan for 7 days
   */
  async set(key, value, ttl = CACHE_DURATION.WORKOUT_PLAN) {
    try {
      const now = Date.now(); // Current time in milliseconds
      const expiresAt = now + ttl; // When this cache will expire

      // Create a cache item with data + expiration time
      const cacheItem = {
        data: value,          // The actual data
        expiresAt: expiresAt, // When it expires
        cachedAt: now,        // When it was cached
      };

      // Convert to JSON string and store
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      
      console.log(`✅ Cached '${key}' until ${new Date(expiresAt).toLocaleString()}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to cache '${key}':`, error);
      return false;
    }
  }

  /**
   * GET CACHE - Retrieve cached data (if not expired)
   * 
   * @param {string} key - The cache key to retrieve
   * @returns {any|null} - The cached data, or null if expired/not found
   * 
   * HOW IT WORKS:
   * 1. Reads the cache item from AsyncStorage
   * 2. Checks if it has expired
   * 3. If expired: deletes it and returns null
   * 4. If fresh: returns the data
   */
  async get(key) {
    try {
      const cachedString = await AsyncStorage.getItem(key);
      
      if (!cachedString) {
        console.log(`ℹ️ No cache found for '${key}'`);
        return null;
      }

      const cacheItem = JSON.parse(cachedString);
      const now = Date.now();

      // Check if cache has expired
      if (now > cacheItem.expiresAt) {
        console.log(`⏰ Cache expired for '${key}' - removing`);
        await this.remove(key); // Clean up expired cache
        return null;
      }

      const ageInMinutes = Math.floor((now - cacheItem.cachedAt) / 60000);
      console.log(`✅ Cache hit for '${key}' (age: ${ageInMinutes} minutes)`);
      
      return cacheItem.data;
    } catch (error) {
      console.error(`❌ Failed to get cache '${key}':`, error);
      return null;
    }
  }

  /**
   * REMOVE CACHE - Delete a specific cache item
   * 
   * @param {string} key - The cache key to remove
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Removed cache for '${key}'`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove cache '${key}':`, error);
      return false;
    }
  }

  /**
   * CLEAR ALL CACHE - Remove all cached data
   * 
   * USE CASES:
   * - User logs out
   * - User wants to clear app data
   * - Testing/debugging
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
      console.log('🗑️ All cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * CHECK IF CACHE EXISTS - Without retrieving the data
   * 
   * @param {string} key - The cache key to check
   * @returns {boolean} - True if cache exists and is not expired
   */
  async has(key) {
    try {
      const cachedString = await AsyncStorage.getItem(key);
      if (!cachedString) return false;

      const cacheItem = JSON.parse(cachedString);
      const now = Date.now();

      return now <= cacheItem.expiresAt;
    } catch (error) {
      console.error(`❌ Failed to check cache '${key}':`, error);
      return false;
    }
  }

  /**
   * GET CACHE INFO - Get metadata about a cache item (without the data)
   * 
   * @param {string} key - The cache key
   * @returns {object|null} - Cache metadata or null
   */
  async getInfo(key) {
    try {
      const cachedString = await AsyncStorage.getItem(key);
      if (!cachedString) return null;

      const cacheItem = JSON.parse(cachedString);
      const now = Date.now();
      const isExpired = now > cacheItem.expiresAt;
      const ageInMinutes = Math.floor((now - cacheItem.cachedAt) / 60000);
      const expiresInMinutes = Math.floor((cacheItem.expiresAt - now) / 60000);

      return {
        key,
        isExpired,
        ageInMinutes,
        expiresInMinutes: isExpired ? 0 : expiresInMinutes,
        cachedAt: new Date(cacheItem.cachedAt).toLocaleString(),
        expiresAt: new Date(cacheItem.expiresAt).toLocaleString(),
      };
    } catch (error) {
      console.error(`❌ Failed to get cache info for '${key}':`, error);
      return null;
    }
  }

  /**
   * CACHE-FIRST STRATEGY - Try cache first, then fallback to API
   * 
   * @param {string} key - Cache key
   * @param {function} fetchFunction - Async function to fetch fresh data
   * @param {number} ttl - Cache duration
   * @returns {object} - { data, fromCache: boolean }
   * 
   * HOW IT WORKS:
   * 1. Try to get data from cache
   * 2. If cache exists and is fresh → return cached data ⚡️
   * 3. If cache is expired/missing → fetch fresh data from API 🌐
   * 4. Store the fresh data in cache for next time
   * 
   * EXAMPLE:
   * const result = await cacheService.cacheFirst(
   *   'workout_plan',
   *   () => planService.getCurrentPlan(),
   *   CACHE_DURATION.WORKOUT_PLAN
   * );
   * 
   * if (result.fromCache) {
   *   console.log('Loaded instantly from cache!');
   * } else {
   *   console.log('Fetched fresh from API');
   * }
   */
  async cacheFirst(key, fetchFunction, ttl = CACHE_DURATION.WORKOUT_PLAN) {
    try {
      // Try cache first
      const cachedData = await this.get(key);
      if (cachedData !== null) {
        console.log(`⚡️ Using cached data for '${key}'`);
        return { data: cachedData, fromCache: true };
      }

      // Cache miss - fetch fresh data
      console.log(`🌐 Cache miss for '${key}' - fetching fresh data`);
      const freshData = await fetchFunction();

      // Store in cache for next time
      await this.set(key, freshData, ttl);

      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error(`❌ Cache-first strategy failed for '${key}':`, error);
      throw error;
    }
  }

  /**
   * INVALIDATE CACHE - Mark cache as expired and refresh
   * 
   * @param {string} key - Cache key to invalidate
   * 
   * USE CASES:
   * - User creates a new workout plan (invalidate old plan)
   * - User updates profile (invalidate old profile)
   * - Force refresh of data
   */
  async invalidate(key) {
    console.log(`♻️ Invalidating cache for '${key}'`);
    return await this.remove(key);
  }

  // ============================================
  // CONVENIENCE METHODS FOR SPECIFIC DATA TYPES
  // ============================================

  /**
   * WORKOUT PLAN CACHE
   */
  async cacheWorkoutPlan(plan) {
    return await this.set(CACHE_KEYS.WORKOUT_PLAN, plan, CACHE_DURATION.WORKOUT_PLAN);
  }

  async getWorkoutPlan() {
    return await this.get(CACHE_KEYS.WORKOUT_PLAN);
  }

  async invalidateWorkoutPlan() {
    return await this.invalidate(CACHE_KEYS.WORKOUT_PLAN);
  }

  /**
   * USER PROFILE CACHE
   */
  async cacheUserProfile(profile) {
    return await this.set(CACHE_KEYS.USER_PROFILE, profile, CACHE_DURATION.USER_PROFILE);
  }

  async getUserProfile() {
    return await this.get(CACHE_KEYS.USER_PROFILE);
  }

  async invalidateUserProfile() {
    return await this.invalidate(CACHE_KEYS.USER_PROFILE);
  }

  /**
   * DAILY MOTIVATION CACHE
   */
  async cacheDailyMotivation(motivation) {
    return await this.set(CACHE_KEYS.DAILY_MOTIVATION, motivation, CACHE_DURATION.DAILY_MOTIVATION);
  }

  async getDailyMotivation() {
    return await this.get(CACHE_KEYS.DAILY_MOTIVATION);
  }

  /**
   * PREFERENCES CACHE
   */
  async cachePreferences(preferences) {
    return await this.set(CACHE_KEYS.PREFERENCES, preferences, CACHE_DURATION.PREFERENCES);
  }

  async getPreferences() {
    return await this.get(CACHE_KEYS.PREFERENCES);
  }

  async invalidatePreferences() {
    return await this.invalidate(CACHE_KEYS.PREFERENCES);
  }

  /**
   * DEBUG: Get all cache info
   */
  async getAllCacheInfo() {
    const keys = Object.values(CACHE_KEYS);
    const info = {};
    
    for (const key of keys) {
      info[key] = await this.getInfo(key);
    }
    
    return info;
  }
}

// Export a single instance (Singleton pattern)
// This means everyone uses the same cache service
const cacheService = new CacheService();

export default cacheService;
export { CACHE_KEYS, CACHE_DURATION };

