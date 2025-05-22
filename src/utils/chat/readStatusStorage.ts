
/**
 * Utility for managing read status of conversations in local storage
 * This provides a local-first approach to marking messages as read
 * before the database is updated
 */

// Constants
const LOCAL_READ_STATUS_KEY = 'versus_read_status';

// Type for read status data
interface ReadStatusData {
  dms: Record<string, number>; // Conversation ID -> timestamp
  clubs: Record<string, number>; // Club ID -> timestamp
}

/**
 * Get all stored read statuses
 */
export const getLocalReadStatus = (): ReadStatusData => {
  try {
    const data = localStorage.getItem(LOCAL_READ_STATUS_KEY);
    if (!data) {
      return { dms: {}, clubs: {} };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[readStatusStorage] Error getting local read status:', error);
    return { dms: {}, clubs: {} };
  }
};

/**
 * Save read status data to local storage
 */
const saveLocalReadStatus = (data: ReadStatusData): void => {
  try {
    localStorage.setItem(LOCAL_READ_STATUS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[readStatusStorage] Error saving local read status:', error);
  }
};

/**
 * Mark a DM conversation as read locally
 */
export const markDmReadLocally = (conversationId: string): void => {
  try {
    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this conversation
    data.dms[conversationId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked DM ${conversationId} as read locally at ${timestamp}`);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'dm', id: conversationId, timestamp }
    }));
    
    // Also dispatch an event specifically for updating the badge
    window.dispatchEvent(new CustomEvent('badge-refresh-required', {
      detail: { immediate: true }
    }));
  } catch (error) {
    console.error('[readStatusStorage] Error marking DM as read locally:', error);
  }
};

/**
 * Mark a club conversation as read locally
 */
export const markClubReadLocally = (clubId: string): void => {
  try {
    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this club
    data.clubs[clubId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked club ${clubId} as read locally at ${timestamp}`);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'club', id: clubId, timestamp }
    }));
    
    // Also dispatch an event specifically for updating the badge
    window.dispatchEvent(new CustomEvent('badge-refresh-required', {
      detail: { immediate: true }
    }));
  } catch (error) {
    console.error('[readStatusStorage] Error marking club as read locally:', error);
  }
};

/**
 * Check if a DM conversation has been read since a specific timestamp
 */
export const isDmReadSince = (conversationId: string, messageTimestamp: number): boolean => {
  try {
    const data = getLocalReadStatus();
    const readTimestamp = data.dms[conversationId];
    
    // If we have no read timestamp, it hasn't been read
    if (!readTimestamp) return false;
    
    // Check if the read timestamp is after the message timestamp
    return readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking DM read since:', error);
    return false;
  }
};

/**
 * Check if a club conversation has been read since a specific timestamp
 */
export const isClubReadSince = (clubId: string, messageTimestamp: number): boolean => {
  try {
    const data = getLocalReadStatus();
    const readTimestamp = data.clubs[clubId];
    
    // If we have no read timestamp, it hasn't been read
    if (!readTimestamp) return false;
    
    // Check if the read timestamp is after the message timestamp
    return readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking club read since:', error);
    return false;
  }
};

/**
 * Get the read timestamp for a specific conversation
 * Returns 0 if not found
 */
export const getReadTimestamp = (type: 'dm' | 'club', id: string): number => {
  try {
    const data = getLocalReadStatus();
    if (type === 'dm') {
      return data.dms[id] || 0;
    } else {
      return data.clubs[id] || 0;
    }
  } catch (error) {
    console.error('[readStatusStorage] Error getting read timestamp:', error);
    return 0;
  }
};
