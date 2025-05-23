
import { supabase } from '@/integrations/supabase/client';
import { getSyncQueue, removeFromSyncQueue } from './readStatusStorage';

// Constants
const SYNC_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;
const MAX_BATCH_SIZE = 10;

// Internal state
let isSyncing = false;
let syncIntervalId: number | null = null;

/**
 * Process a single sync item
 */
const processSyncItem = async (
  userId: string | undefined,
  type: 'dm' | 'club',
  id: string
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log(`[ReadStatusSync] Syncing ${type} ${id} to database`);
    
    if (type === 'dm') {
      // Mark DM conversation as read in the database
      const { error } = await supabase.rpc(
        'mark_conversation_as_read',
        {
          p_conversation_id: id,
          p_user_id: userId
        }
      );
      
      if (error) throw error;
    } else {
      // Mark club messages as read in the database
      const { error } = await supabase.rpc(
        'mark_club_as_read',
        {
          p_club_id: id,
          p_user_id: userId
        }
      );
      
      if (error) throw error;
    }
    
    console.log(`[ReadStatusSync] Successfully synced ${type} ${id}`);
    return true;
  } catch (error) {
    console.error(`[ReadStatusSync] Error syncing ${type} ${id}:`, error);
    return false;
  }
};

/**
 * Process the sync queue
 */
const processQueue = async (userId: string | undefined): Promise<void> => {
  if (isSyncing || !userId) return;
  
  try {
    isSyncing = true;
    const queue = getSyncQueue();
    
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }
    
    console.log(`[ReadStatusSync] Processing queue with ${queue.length} items`);
    
    // Take a batch of items to process
    const batch = queue.slice(0, MAX_BATCH_SIZE);
    
    // Process items in parallel
    const results = await Promise.all(
      batch.map(async item => {
        const success = await processSyncItem(userId, item.type, item.id);
        
        if (success) {
          // Remove from queue if successful
          removeFromSyncQueue(item.type, item.id);
          return { success: true, item };
        } else {
          // Increase retry count or remove if max retries reached
          const retries = (item.retries || 0) + 1;
          if (retries >= MAX_RETRIES) {
            removeFromSyncQueue(item.type, item.id);
            return { success: false, maxRetries: true, item };
          }
          
          // Update retry count
          const updatedQueue = getSyncQueue();
          const itemToUpdate = updatedQueue.find(
            qItem => qItem.type === item.type && qItem.id === item.id
          );
          
          if (itemToUpdate) {
            itemToUpdate.retries = retries;
            // Save the updated queue
            localStorage.setItem('versus_read_sync_queue', JSON.stringify(updatedQueue));
          }
          
          return { success: false, maxRetries: false, item, retries };
        }
      })
    );
    
    // Log results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const removed = results.filter(r => !r.success && r.maxRetries).length;
    
    console.log(`[ReadStatusSync] Processed ${batch.length} items. Success: ${successful}, Failed: ${failed}, Removed due to max retries: ${removed}`);
    
  } catch (error) {
    console.error('[ReadStatusSync] Error processing queue:', error);
  } finally {
    isSyncing = false;
  }
};

/**
 * Start the background sync service
 */
export const startReadStatusSync = (userId: string | undefined): void => {
  if (syncIntervalId !== null) {
    stopReadStatusSync();
  }
  
  if (!userId) {
    console.warn('[ReadStatusSync] Cannot start sync without user ID');
    return;
  }
  
  console.log('[ReadStatusSync] Starting background sync service');
  
  // Run once immediately
  processQueue(userId);
  
  // Then set up interval
  syncIntervalId = window.setInterval(() => {
    processQueue(userId);
  }, SYNC_INTERVAL);
};

/**
 * Stop the background sync service
 */
export const stopReadStatusSync = (): void => {
  if (syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[ReadStatusSync] Stopped background sync service');
  }
};

/**
 * Force sync specific items immediately
 * Useful for when user is leaving the app or for critical syncs
 */
export const forceSyncItems = async (
  userId: string | undefined,
  items: { type: 'dm' | 'club', id: string }[]
): Promise<boolean> => {
  if (!userId || items.length === 0) return false;
  
  let allSuccessful = true;
  
  for (const item of items) {
    const success = await processSyncItem(userId, item.type, item.id);
    if (success) {
      removeFromSyncQueue(item.type, item.id);
    } else {
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
};

/**
 * Trigger an immediate sync of the entire queue
 */
export const syncNow = async (userId: string | undefined): Promise<void> => {
  if (!userId) return;
  await processQueue(userId);
};
