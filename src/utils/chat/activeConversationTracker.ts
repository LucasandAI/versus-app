
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
    
    // Store the active conversation in local storage
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify(activeConversation));
    
    console.log(`[activeConversationTracker] Marking ${type} ${id} as active`);
    
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
    
    console.log('[activeConversationTracker] Cleared active conversation');
    
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
    
    // Check if this is the active conversation and it was marked active in the last 5 minutes
    // (shorter timeout to ensure active state is more accurate)
    const isActive = active.type === type && active.id === id;
    const isRecent = Date.now() - active.timestamp < 5 * 60 * 1000; // 5 minutes
    
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
    
    const active = JSON.parse(activeJson) as ActiveConversation;
    
    // Check if the active state is still valid (not older than 5 minutes)
    const isRecent = Date.now() - active.timestamp < 5 * 60 * 1000; // 5 minutes
    
    return isRecent ? active : null;
  } catch (error) {
    console.error('[activeConversationTracker] Error getting active conversation:', error);
    return null;
  }
};
