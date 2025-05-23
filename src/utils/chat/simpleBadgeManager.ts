
/**
 * A simple utility to manage chat badge counts using localStorage
 * This provides a lightweight alternative to the full unread messages system
 * focusing only on badge display without affecting message handling
 */

const BADGE_COUNT_KEY = 'versus_chat_badge_count';

/**
 * Get the current badge count from localStorage
 */
export const getBadgeCount = (): number => {
  const stored = localStorage.getItem(BADGE_COUNT_KEY);
  return stored ? parseInt(stored, 10) : 0;
};

/**
 * Set the badge count and update localStorage
 */
export const setBadgeCount = (count: number): void => {
  const validCount = Math.max(0, count); // Ensure non-negative
  localStorage.setItem(BADGE_COUNT_KEY, validCount.toString());
  
  // Dispatch event to notify listeners
  window.dispatchEvent(
    new CustomEvent('badge-count-changed', { detail: { count: validCount } })
  );
};

/**
 * Increment the badge count by a specified amount (default 1)
 */
export const incrementBadgeCount = (amount = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = currentCount + amount;
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Decrement the badge count by a specified amount (default 1)
 * Will not go below zero
 */
export const decrementBadgeCount = (amount = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = Math.max(0, currentCount - amount);
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Reset badge count to zero
 */
export const clearBadgeCount = (): void => {
  setBadgeCount(0);
};

/**
 * Utility to simulate a new message arriving with badge update
 * This can be used to test the badge functionality
 */
export const simulateNewMessage = (): void => {
  incrementBadgeCount();
  window.dispatchEvent(new CustomEvent('chat-message-received'));
};

/**
 * Utility to mark all messages as read
 */
export const markAllAsRead = (): void => {
  clearBadgeCount();
  window.dispatchEvent(new CustomEvent('chat-all-read'));
};
