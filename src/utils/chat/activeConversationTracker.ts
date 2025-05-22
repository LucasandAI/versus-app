
/**
 * Utility for tracking which conversations are currently open/active
 * to prevent marking messages as unread when the user is already viewing them
 */

// Store active conversation information in local storage for persistence
const ACTIVE_CONVERSATION_KEY = 'versus_active_conversations';

// Interface for active conversation data
interface ActiveConversation {
  type: 'club' | 'dm';
  id: string;
  timestamp: number;
}

/**
 * Mark a conversation as active (user is currently viewing it)
 */
export const markConversationActive = (type: 'club' | 'dm', id: string): void => {
  try {
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
    
    console.log(`[activeConversationTracker] Marking ${type} ${id} as active`);
    
    // Dispatch an event so other components can react to this change
    window.dispatchEvent(new CustomEvent('conversation-active-change', { 
      detail: { type, id, timestamp }
    }));
  } catch (error) {
    console.error('[activeConversationTracker] Error marking conversation active:', error);
  }
};

/**
 * Remove a specific conversation from the active list
 */
export const removeActiveConversation = (type: 'club' | 'dm', id: string): void => {
  try {
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
 */
export const isConversationActive = (type: 'club' | 'dm', id: string): boolean => {
  try {
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return false;
    
    const activeConversations: Record<string, ActiveConversation> = JSON.parse(activeJson);
    
    // Create a unique key for this conversation
    const conversationKey = `${type}_${id}`;
    
    // Check if conversation exists and is recent
    const conversation = activeConversations[conversationKey];
    if (!conversation) return false;
    
    // Check if the timestamp is recent (within last 5 minutes)
    const isRecent = Date.now() - conversation.timestamp < 5 * 60 * 1000;
    
    return isRecent;
  } catch (error) {
    console.error('[activeConversationTracker] Error checking active conversation:', error);
    return false;
  }
};

/**
 * Get all currently active conversations
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

// Export the original clearActiveConversation for backward compatibility
export const clearActiveConversation = clearActiveConversations;
