
/**
 * Utility for managing read status of conversations in local storage
 * This provides a local-first approach to marking messages as read
 * before the database is updated
 */

// Constants
const LOCAL_READ_STATUS_KEY = 'versus_read_status';
const SYNC_QUEUE_KEY = 'versus_read_sync_queue';

// Types for read status data
interface ReadStatusData {
  dms: Record<string, number>; // Conversation ID -> timestamp
  clubs: Record<string, number>; // Club ID -> timestamp
}

interface SyncQueueItem {
  type: 'dm' | 'club';
  id: string;
  timestamp: number;
  retries?: number;
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
 * Get the queue of items that need to be synced with the database
 */
export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[readStatusStorage] Error getting sync queue:', error);
    return [];
  }
};

/**
 * Save the sync queue to local storage
 */
const saveSyncQueue = (queue: SyncQueueItem[]): void => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[readStatusStorage] Error saving sync queue:', error);
  }
};

/**
 * Add an item to the sync queue
 */
const addToSyncQueue = (item: SyncQueueItem): void => {
  const queue = getSyncQueue();
  
  // Check if this item is already in the queue
  const existingIndex = queue.findIndex(
    queueItem => queueItem.type === item.type && queueItem.id === item.id
  );
  
  if (existingIndex >= 0) {
    // Update the existing item with the new timestamp
    queue[existingIndex].timestamp = item.timestamp;
  } else {
    // Add the new item
    queue.push(item);
  }
  
  saveSyncQueue(queue);
};

/**
 * Remove an item from the sync queue
 */
export const removeFromSyncQueue = (type: 'dm' | 'club', id: string): void => {
  const queue = getSyncQueue();
  const updatedQueue = queue.filter(
    item => !(item.type === type && item.id === id)
  );
  saveSyncQueue(updatedQueue);
};

/**
 * Validate conversation ID to ensure it's a valid string and not empty
 */
const isValidId = (id: any): boolean => {
  return typeof id === 'string' && id.trim().length > 0;
};

/**
 * Mark a DM conversation as read locally
 */
export const markDmReadLocally = (conversationId: string): boolean => {
  try {
    // Validate ID first
    if (!isValidId(conversationId)) {
      console.error(`[readStatusStorage] Invalid conversation ID: ${conversationId}`);
      return false;
    }

    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this conversation
    data.dms[conversationId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked DM ${conversationId} as read locally at ${timestamp}`);
    
    // Add to sync queue for background sync
    addToSyncQueue({
      type: 'dm',
      id: conversationId,
      timestamp
    });
    
    // Dispatch events to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'dm', id: conversationId, timestamp }
    }));
    
    window.dispatchEvent(new CustomEvent('badge-refresh-required', {
      detail: { immediate: true }
    }));
    
    return true;
  } catch (error) {
    console.error('[readStatusStorage] Error marking DM as read locally:', error);
    return false;
  }
};

/**
 * Mark a club conversation as read locally
 */
export const markClubReadLocally = (clubId: string): boolean => {
  try {
    // Validate ID first
    if (!isValidId(clubId)) {
      console.error(`[readStatusStorage] Invalid club ID: ${clubId}`);
      return false;
    }

    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this club
    data.clubs[clubId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked club ${clubId} as read locally at ${timestamp}`);
    
    // Add to sync queue for background sync
    addToSyncQueue({
      type: 'club',
      id: clubId,
      timestamp
    });
    
    // Dispatch events to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'club', id: clubId, timestamp }
    }));
    
    window.dispatchEvent(new CustomEvent('badge-refresh-required', {
      detail: { immediate: true }
    }));
    
    return true;
  } catch (error) {
    console.error('[readStatusStorage] Error marking club as read locally:', error);
    return false;
  }
};

/**
 * Check if a DM conversation has been read since a specific timestamp
 */
export const isDmReadSince = (conversationId: string, messageTimestamp: number): boolean => {
  try {
    // Return false early for invalid IDs
    if (!isValidId(conversationId)) return false;
    
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
    // Return false early for invalid IDs
    if (!isValidId(clubId)) return false;
    
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
    // Return 0 for invalid IDs
    if (!isValidId(id)) return 0;
    
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

/**
 * Clear read status for testing or reset purposes
 */
export const clearReadStatus = (type: 'dm' | 'club', id: string): void => {
  try {
    if (!isValidId(id)) return;
    
    const data = getLocalReadStatus();
    if (type === 'dm') {
      delete data.dms[id];
    } else {
      delete data.clubs[id];
    }
    
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Cleared ${type} read status for ${id}`);
    
    // Dispatch refresh event
    window.dispatchEvent(new CustomEvent('badge-refresh-required', {
      detail: { immediate: true }
    }));
  } catch (error) {
    console.error('[readStatusStorage] Error clearing read status:', error);
  }
};

// Batch operations for efficiency
export const markMultipleAsRead = (items: {type: 'dm' | 'club', id: string}[]): void => {
  try {
    if (!items.length) return;
    
    const data = getLocalReadStatus();
    const timestamp = Date.now();
    let changed = false;
    
    items.forEach(item => {
      if (!isValidId(item.id)) return;
      
      if (item.type === 'dm') {
        data.dms[item.id] = timestamp;
      } else {
        data.clubs[item.id] = timestamp;
      }
      changed = true;
      
      // Add each item to sync queue
      addToSyncQueue({
        type: item.type,
        id: item.id,
        timestamp
      });
    });
    
    if (changed) {
      saveLocalReadStatus(data);
      
      // Dispatch a single event for all changes
      window.dispatchEvent(new CustomEvent('local-read-status-change', {
        detail: { 
          batchUpdate: true,
          timestamp,
          items 
        }
      }));
      
      window.dispatchEvent(new CustomEvent('badge-refresh-required', {
        detail: { immediate: true }
      }));
    }
  } catch (error) {
    console.error('[readStatusStorage] Error in batch mark as read:', error);
  }
};
