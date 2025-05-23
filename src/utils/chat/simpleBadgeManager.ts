
/**
 * Simple utility for managing chat badge counts in local storage
 * This provides a local-first approach to managing unread message counts
 * without relying on complex database queries and subscriptions
 */

// Constants
const LOCAL_BADGE_COUNT_KEY = 'versus_badge_count';

/**
 * Get the current badge count from local storage
 */
export const getBadgeCount = (): number => {
  try {
    const count = localStorage.getItem(LOCAL_BADGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('[simpleBadgeManager] Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set the badge count in local storage
 */
export const setBadgeCount = (count: number): void => {
  try {
    // Ensure count is never negative
    const sanitizedCount = Math.max(0, count);
    localStorage.setItem(LOCAL_BADGE_COUNT_KEY, sanitizedCount.toString());
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('badge-count-changed', {
      detail: { count: sanitizedCount }
    }));
    
    console.log(`[simpleBadgeManager] Badge count set to: ${sanitizedCount}`);
  } catch (error) {
    console.error('[simpleBadgeManager] Error setting badge count:', error);
  }
};

/**
 * Increment the badge count by a specific amount (default: 1)
 */
export const incrementBadgeCount = (amount: number = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = currentCount + amount;
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Decrement the badge count by a specific amount (default: 1)
 * Only if it's greater than zero
 */
export const decrementBadgeCount = (amount: number = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = Math.max(0, currentCount - amount);
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Reset the badge count to zero
 */
export const resetBadgeCount = (): void => {
  setBadgeCount(0);
};

/**
 * Initialize the badge count from the database
 * This should be called once at app startup
 */
export const initializeBadgeCountFromDatabase = (count: number): void => {
  console.log(`[simpleBadgeManager] Initializing badge count from database: ${count}`);
  setBadgeCount(count);
};

/**
 * Helper function to simulate a new message notification
 * This is useful for testing the badge functionality
 */
export const simulateNewMessage = (conversationId?: string, conversationType?: 'dm' | 'club'): void => {
  incrementBadgeCount();
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('unread-message-received', {
    detail: conversationId && conversationType ? { conversationId, conversationType } : undefined
  }));
};

/**
 * Request a badge refresh from all components
 * This will trigger a full badge count recalculation if needed
 */
export const requestBadgeRefresh = (immediate: boolean = false): void => {
  window.dispatchEvent(new CustomEvent('badge-refresh-required', {
    detail: { immediate }
  }));
};
