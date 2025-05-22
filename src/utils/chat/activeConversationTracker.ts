
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
    const activeConversation: ActiveConversation = {
      type,
      id,
      timestamp: Date.now()
    };
    
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(activeConversation));
    
    // Also dispatch an event so other components can react to this change
    window.dispatchEvent(new CustomEvent('conversation-active-change', { 
      detail: activeConversation 
    }));
  } catch (error) {
    console.error('[activeConversationTracker] Error marking conversation active:', error);
  }
};

/**
 * Mark that no conversation is currently active
 */
export const clearActiveConversation = (): void => {
  try {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('conversation-active-change', { 
      detail: null 
    }));
  } catch (error) {
    console.error('[activeConversationTracker] Error clearing active conversation:', error);
  }
};

/**
 * Check if a specific conversation is currently active
 */
export const isConversationActive = (type: 'club' | 'dm', id: string): boolean => {
  try {
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return false;
    
    const active = JSON.parse(activeJson) as ActiveConversation;
    
    // Check if this is the active conversation and it was marked active in the last hour
    // (in case the app was closed without clearing the active conversation)
    const isActive = active.type === type && active.id === id;
    const isRecent = Date.now() - active.timestamp < 60 * 60 * 1000; // 1 hour
    
    return isActive && isRecent;
  } catch (error) {
    console.error('[activeConversationTracker] Error checking active conversation:', error);
    return false;
  }
};

/**
 * Get the currently active conversation, if any
 */
export const getActiveConversation = (): ActiveConversation | null => {
  try {
    const activeJson = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeJson) return null;
    
    return JSON.parse(activeJson) as ActiveConversation;
  } catch (error) {
    console.error('[activeConversationTracker] Error getting active conversation:', error);
    return null;
  }
};
