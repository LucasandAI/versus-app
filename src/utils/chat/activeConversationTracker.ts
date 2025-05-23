
/**
 * Utility for tracking which conversations are currently open/active
 * to prevent marking messages as unread when the user is already viewing them
 */

// Store active conversation information in local storage for persistence
const ACTIVE_CONVERSATION_KEY = 'versus_active_conversations';
const VIEWED_CONVERSATIONS_HISTORY_KEY = 'versus_viewed_conversations_history';

// Interface for active conversation data
interface ActiveConversation {
  type: 'club' | 'dm';
  id: string;
  timestamp: number;
}

/**
 * Mark a conversation as active (user is currently viewing it)
 * This indicates the user is currently looking at this conversation
 */
export const markConversationActive = (type: 'club' | 'dm', id: string): void => {
  try {
    if (!id || !type) {
      console.error('[activeConversationTracker] Invalid params:', { type, id });
      return;
    }
    
    const timestamp = Date.now();
    
    // Get current active conversations
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    const activeConversations: Record<string, ActiveConversation> = activeJson ? 
      JSON.parse(activeJson) : {};
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Add/update the conversation in the list
    activeConversations[conversationKey] = {
      type,
      id,
      timestamp
    };
    
    // Store the updated list of active conversations
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(activeConversations));
    
    console.log(`[activeConversationTracker] Marking ${type} ${id} as active at ${timestamp}`);
    
    // Also track in viewed history for badge refresh purposes
    addToViewedHistory(type, id);
    
    // Dispatch events synchronously to ensure immediate notification
    window.dispatchEvent(new CustomEvent('conversation-active-change', { 
      detail: { type, id, timestamp }
    }));
    
    // Dispatch a dedicated event for badge refresh
    window.dispatchEvent(new CustomEvent('conversation-opened', {
      detail: { type, id, timestamp }
    }));
  } catch (error) {
    console.error('[activeConversationTracker] Error marking conversation active:', error);
  }
};

/**
 * Add a conversation to the viewed history
 * This helps us track when a conversation was explicitly viewed by the user
 */
const addToViewedHistory = (type: 'club' | 'dm', id: string): void => {
  try {
    if (!id || !type) return;
    
    const timestamp = Date.now();
    
    // Get current viewed history
    const historyJson = localStorage.getItem(VIEWED_CONVERSATIONS_HISTORY_KEY);
    const viewedHistory: Record<string, number> = historyJson ? 
      JSON.parse(historyJson) : {};
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Update the timestamp for this conversation
    viewedHistory[conversationKey] = timestamp;
    
    // Store the updated viewed history
    localStorage.setItem(VIEWED_CONVERSATIONS_HISTORY_KEY, JSON.stringify(viewedHistory));
    
    console.log(`[activeConversationTracker] Added ${type} ${id} to viewed history at ${timestamp}`);
  } catch (error) {
    console.error('[activeConversationTracker] Error adding to viewed history:', error);
  }
};

/**
 * Check if a conversation has been viewed since a specific timestamp
 */
export const hasBeenViewedSince = (type: 'club' | 'dm', id: string, since: number): boolean => {
  try {
    if (!id || !type) return false;
    
    // Get current viewed history
    const historyJson = localStorage.getItem(VIEWED_CONVERSATIONS_HISTORY_KEY);
    if (!historyJson) return false;
    
    const viewedHistory: Record<string, number> = JSON.parse(historyJson);
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Check if the conversation has been viewed since the given timestamp
    const viewedAt = viewedHistory[conversationKey];
    if (!viewedAt) return false;
    
    return viewedAt > since;
  } catch (error) {
    console.error('[activeConversationTracker] Error checking viewed history:', error);
    return false;
  }
};

/**
 * Remove a specific conversation from the active list
 */
export const removeActiveConversation = (type: 'club' | 'dm', id: string): void => {
  try {
    if (!id || !type) return;
    
    // Get current active conversations
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return;
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Delete the conversation if it exists
    if (activeConversations[conversationKey]) {
      delete activeConversations[conversationKey];
      
      // Store the updated list
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(activeConversations));
      
      console.log(`[activeConversationTracker] Removed ${type} ${id} from active conversations`);
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('conversation-active-change', { 
        detail: null 
      }));
    }
  } catch (error) {
    console.error('[activeConversationTracker] Error removing active conversation:', error);
  }
};

/**
 * Clear all active conversations
 */
export const clearActiveConversations = (): void => {
  try {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    
    console.log('[activeConversationTracker] Cleared all active conversations');
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('conversation-active-change', { 
      detail: null 
    }));
  } catch (error) {
    console.error('[activeConversationTracker] Error clearing active conversations:', error);
  }
};

/**
 * Check if a specific conversation is currently active
 * Returns true if the conversation is active and the timestamp is recent
 */
export const isConversationActive = (type: 'club' | 'dm', id: string): boolean => {
  try {
    if (!id || !type) return false;
    
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return false;
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Check if conversation exists and is recent
    const conversation = activeConversations[conversationKey];
    if (!conversation) return false;
    
    // Check if the timestamp is recent (within last 5 minutes)
    // Using a shorter time window to ensure we don't miss new messages
    const isRecent = Date.now() - conversation.timestamp < 5 * 60 * 1000;
    
    return isRecent;
  } catch (error) {
    console.error('[activeConversationTracker] Error checking active conversation:', error);
    return false;
  }
};

/**
 * Get all currently active conversations
 * Returns only fresh conversations (active in last 5 minutes)
 */
export const getActiveConversations = (): Record<string, ActiveConversation> => {
  try {
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return {};
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    
    // Filter out stale conversations (older than 5 minutes)
    const now = Date.now();
    const freshConversations: Record<string, ActiveConversation> = {};
    
    Object.keys(activeConversations).forEach(key => {
      const conversation = activeConversations[key];
      if (now - conversation.timestamp < 5 * 60 * 1000) {
        freshConversations[key] = conversation;
      }
    });
    
    return freshConversations;
  } catch (error) {
    console.error('[activeConversationTracker] Error getting active conversations:', error);
    return {};
  }
};

/**
 * Get a specific active conversation by type and id
 */
export const getActiveConversation = (type: 'club' | 'dm', id: string): ActiveConversation | null => {
  try {
    if (!id || !type) return null;
    
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return null;
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Get the conversation if it exists
    const conversation = activeConversations[conversationKey];
    if (!conversation) return null;
    
    // Check if the timestamp is recent (within last 5 minutes)
    const isRecent = Date.now() - conversation.timestamp < 5 * 60 * 1000;
    
    return isRecent ? conversation : null;
  } catch (error) {
    console.error('[activeConversationTracker] Error getting active conversation:', error);
    return null;
  }
};

/**
 * Update the active timestamp for a conversation
 * This is useful to refresh the active status without triggering events
 */
export const refreshActiveTimestamp = (type: 'club' | 'dm', id: string): void => {
  try {
    if (!id || !type) return;
    
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return;
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    const conversationKey = `${type}_${id}`;
    
    if (activeConversations[conversationKey]) {
      activeConversations[conversationKey].timestamp = Date.now();
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(activeConversations));
    }
  } catch (error) {
    console.error('[activeConversationTracker] Error refreshing active timestamp:', error);
  }
};

// Export the original clearActiveConversation for backward compatibility
export const clearActiveConversation = clearActiveConversations;
