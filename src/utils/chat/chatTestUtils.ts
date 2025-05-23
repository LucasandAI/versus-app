
import { incrementBadgeCount, clearBadgeCount } from './simpleBadgeManager';

/**
 * Utility to simulate receiving a new message
 * This will increment the badge count and trigger the necessary events
 */
export const simulateNewMessage = () => {
  incrementBadgeCount();
  
  // Dispatch an event to notify the UI
  window.dispatchEvent(new CustomEvent('chat-message-received'));
  
  // For debugging
  console.log('[Chat Test] Simulated new message, badge count updated');
};

/**
 * Utility to simulate marking all messages as read
 */
export const simulateMarkAllAsRead = () => {
  clearBadgeCount();
  
  // Dispatch an event to notify the UI
  window.dispatchEvent(new CustomEvent('chat-all-read'));
  
  // For debugging
  console.log('[Chat Test] Simulated mark all as read, badge count cleared');
};

/**
 * Utility to integrate with the existing ChatDrawer
 * This will clear badges when the drawer is opened
 */
export const setupChatDrawerIntegration = () => {
  console.log('[Chat Test] Setting up chat drawer integration');
  
  // Listen for drawer open events
  document.addEventListener('chat-drawer-opened', () => {
    clearBadgeCount();
  });
};
