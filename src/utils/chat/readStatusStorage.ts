
/**
 * Utility for locally storing read status information for messages
 * to provide immediate feedback while database updates happen in the background
 */

// Store read status information in local storage
const CLUB_READ_STATUS_KEY = 'versus_club_read_status';
const DM_READ_STATUS_KEY = 'versus_dm_read_status';

// Types for read status data
interface ReadStatusMap {
  [id: string]: number; // Map of conversation/club ID to timestamp
}

/**
 * Mark a club's messages as read locally
 */
export const markClubReadLocally = (clubId: string): void => {
  try {
    const timestamp = Date.now();
    const storedData = localStorage.getItem(CLUB_READ_STATUS_KEY);
    const readStatus: ReadStatusMap = storedData ? JSON.parse(storedData) : {};
    
    // Update the timestamp for this club
    readStatus[clubId] = timestamp;
    
    localStorage.setItem(CLUB_READ_STATUS_KEY, JSON.stringify(readStatus));
    console.log(`[readStatusStorage] Club ${clubId} marked as read locally at ${timestamp}`);
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('local-read-status-change'));
  } catch (error) {
    console.error('[readStatusStorage] Error marking club read locally:', error);
  }
};

/**
 * Mark a DM conversation's messages as read locally
 */
export const markDmReadLocally = (conversationId: string): void => {
  try {
    const timestamp = Date.now();
    const storedData = localStorage.getItem(DM_READ_STATUS_KEY);
    const readStatus: ReadStatusMap = storedData ? JSON.parse(storedData) : {};
    
    // Update the timestamp for this conversation
    readStatus[conversationId] = timestamp;
    
    localStorage.setItem(DM_READ_STATUS_KEY, JSON.stringify(readStatus));
    console.log(`[readStatusStorage] DM ${conversationId} marked as read locally at ${timestamp}`);
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('local-read-status-change'));
  } catch (error) {
    console.error('[readStatusStorage] Error marking DM read locally:', error);
  }
};

/**
 * Check if a club has been read since a given timestamp
 */
export const isClubReadSince = (clubId: string, messageTimestamp: number): boolean => {
  try {
    const storedData = localStorage.getItem(CLUB_READ_STATUS_KEY);
    if (!storedData) return false;
    
    const readStatus: ReadStatusMap = JSON.parse(storedData);
    const readTimestamp = readStatus[clubId];
    
    // If we have a read timestamp and it's newer than the message timestamp, the message is read
    return !!readTimestamp && readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking club read status:', error);
    return false;
  }
};

/**
 * Check if a DM conversation has been read since a given timestamp
 */
export const isDmReadSince = (conversationId: string, messageTimestamp: number): boolean => {
  try {
    const storedData = localStorage.getItem(DM_READ_STATUS_KEY);
    if (!storedData) return false;
    
    const readStatus: ReadStatusMap = JSON.parse(storedData);
    const readTimestamp = readStatus[conversationId];
    
    // If we have a read timestamp and it's newer than the message timestamp, the message is read
    return !!readTimestamp && readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking DM read status:', error);
    return false;
  }
};

/**
 * Get all locally stored read status information
 */
export const getLocalReadStatus = () => {
  try {
    const clubData = localStorage.getItem(CLUB_READ_STATUS_KEY);
    const dmData = localStorage.getItem(DM_READ_STATUS_KEY);
    
    return {
      clubs: clubData ? JSON.parse(clubData) as ReadStatusMap : {},
      dms: dmData ? JSON.parse(dmData) as ReadStatusMap : {}
    };
  } catch (error) {
    console.error('[readStatusStorage] Error getting local read status:', error);
    return { clubs: {}, dms: {} };
  }
};
