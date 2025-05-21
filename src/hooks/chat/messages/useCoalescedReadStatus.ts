
import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

// A utility function to debounce function calls with configurable options
const debounce = <F extends (...args: any[]) => any>(
  func: F, 
  wait: number,
  options: { leading?: boolean } = {}
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    // Execute immediately if leading is true and not currently in timeout
    const callNow = options.leading && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
};

// Local storage key constants for better maintainability
const LOCAL_STORAGE_KEYS = {
  CLUB_READ_TIMES: 'club_read_times',
  DM_READ_TIMES: 'dm_read_times'
};

export const useCoalescedReadStatus = () => {
  const { currentUser } = useApp();
  const pendingMarkAsRead = useRef<{
    conversations: Set<string>,
    clubs: Set<string>
  }>({
    conversations: new Set<string>(),
    clubs: new Set<string>()
  });
  
  // Maintain local storage cache of read timestamps
  const localReadTimes = useRef<{
    conversations: Record<string, string>, // conversationId -> timestamp
    clubs: Record<string, string> // clubId -> timestamp
  }>({
    conversations: {},
    clubs: {}
  });
  
  // Track active conversation/club to avoid redundant marking
  const activeConversation = useRef<{type: 'dm'|'club'|null, id: string|null}>({
    type: null, 
    id: null
  });
  
  // Track if we're online (for error handling)
  const isOnline = useRef<boolean>(true);

  // Track retry attempts
  const retryCount = useRef<{
    conversations: Record<string, number>,
    clubs: Record<string, number>
  }>({
    conversations: {},
    clubs: {}
  });
  
  // Maximum retry attempts before giving up
  const MAX_RETRIES = 3;

  // Load stored timestamps from localStorage on mount
  useEffect(() => {
    try {
      const storedClubTimes = localStorage.getItem(LOCAL_STORAGE_KEYS.CLUB_READ_TIMES);
      const storedDmTimes = localStorage.getItem(LOCAL_STORAGE_KEYS.DM_READ_TIMES);
      
      if (storedClubTimes) {
        localReadTimes.current.clubs = JSON.parse(storedClubTimes);
      }
      
      if (storedDmTimes) {
        localReadTimes.current.conversations = JSON.parse(storedDmTimes);
      }
      
      console.log('[useCoalescedReadStatus] Loaded read times from localStorage', {
        clubs: Object.keys(localReadTimes.current.clubs).length,
        conversations: Object.keys(localReadTimes.current.conversations).length
      });
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error loading read times from localStorage:', error);
    }
  }, []);
  
  // Update the active conversation tracking
  useEffect(() => {
    const handleActiveConversationChanged = (event: CustomEvent) => {
      console.log('[useCoalescedReadStatus] Active conversation changed:', event.detail);
      activeConversation.current = {
        type: event.detail.type,
        id: event.detail.id
      };
      
      // If we have an active conversation, mark it as read immediately
      if (event.detail.type === 'dm' && event.detail.id) {
        markConversationAsRead(event.detail.id, true);
      } else if (event.detail.type === 'club' && event.detail.id) {
        markClubAsRead(event.detail.id, true);
      }
    };
    
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    // Listen for visibility change to refresh read status when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useCoalescedReadStatus] Tab became visible, checking active conversation');
        if (activeConversation.current.type === 'dm' && activeConversation.current.id) {
          markConversationAsRead(activeConversation.current.id, false);
        } else if (activeConversation.current.type === 'club' && activeConversation.current.id) {
          markClubAsRead(activeConversation.current.id, false);
        }
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[useCoalescedReadStatus] Online status: online');
      isOnline.current = true;
      
      // Try to process any pending updates
      if (activeConversation.current.type === 'dm' && activeConversation.current.id) {
        processConversationMarks();
      } else if (activeConversation.current.type === 'club' && activeConversation.current.id) {
        processClubMarks();
      }
    };
    
    const handleOffline = () => {
      console.log('[useCoalescedReadStatus] Online status: offline');
      isOnline.current = false;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save local read times to localStorage when they change
  const saveLocalReadTimes = useCallback(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.CLUB_READ_TIMES, 
        JSON.stringify(localReadTimes.current.clubs)
      );
      
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.DM_READ_TIMES, 
        JSON.stringify(localReadTimes.current.conversations)
      );
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error saving read times to localStorage:', error);
    }
  }, []);
  
  // Process pending conversation marks with increased debounce time and retry handling
  const processConversationMarks = useCallback(debounce(async () => {
    if (!currentUser?.id || !isOnline.current) return;
    
    const conversationsToMark = Array.from(pendingMarkAsRead.current.conversations);
    if (conversationsToMark.length === 0) return;
    
    console.log(`[useCoalescedReadStatus] Processing ${conversationsToMark.length} conversation read marks`);
    
    try {
      // Process in batches if needed
      const batchSize = 10;
      for (let i = 0; i < conversationsToMark.length; i += batchSize) {
        const batch = conversationsToMark.slice(i, i + batchSize);
        
        // Create upsert items for each conversation
        const upsertItems = batch.map(conversationId => ({
          conversation_id: conversationId,
          user_id: currentUser.id,
          last_read_timestamp: localReadTimes.current.conversations[conversationId] || new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('direct_messages_read')
          .upsert(upsertItems, { 
            onConflict: 'conversation_id,user_id',
            ignoreDuplicates: false
          });
          
        if (error) {
          // Only throw if it's not a duplicate error
          if (error.code !== '23505') {
            throw error;
          }
        }
        
        // Clear processed items from the pending set
        batch.forEach(id => {
          pendingMarkAsRead.current.conversations.delete(id);
          // Reset retry count on success
          if (retryCount.current.conversations[id]) {
            delete retryCount.current.conversations[id];
          }
        });
      }
      
      // Notify that messages have been marked as read
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
        detail: { type: 'dm', batched: true }
      }));
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error marking conversations as read:', error);
      
      // Handle retries for failed conversations
      conversationsToMark.forEach(id => {
        if (!retryCount.current.conversations[id]) {
          retryCount.current.conversations[id] = 1;
        } else {
          retryCount.current.conversations[id]++;
        }
        
        // Remove from pending if max retries reached
        if (retryCount.current.conversations[id] > MAX_RETRIES) {
          console.log(`[useCoalescedReadStatus] Max retries reached for conversation ${id}, removing from pending`);
          pendingMarkAsRead.current.conversations.delete(id);
        }
      });
      
      // Only show toast if we've reached max retries
      const failedIds = conversationsToMark.filter(id => retryCount.current.conversations[id] >= MAX_RETRIES);
      if (failedIds.length > 0) {
        toast({
          title: "Error updating message status",
          description: "Some messages couldn't be marked as read. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  }, 500), [currentUser?.id]); // Increased debounce to 500ms for better batching
  
  // Process pending club marks with increased debounce time and retry handling
  const processClubMarks = useCallback(debounce(async () => {
    if (!currentUser?.id || !isOnline.current) return;
    
    const clubsToMark = Array.from(pendingMarkAsRead.current.clubs);
    if (clubsToMark.length === 0) return;
    
    console.log(`[useCoalescedReadStatus] Processing ${clubsToMark.length} club read marks`);
    
    try {
      // Process in batches if needed
      const batchSize = 10;
      for (let i = 0; i < clubsToMark.length; i += batchSize) {
        const batch = clubsToMark.slice(i, i + batchSize);
        
        // Create upsert items for each club
        const upsertItems = batch.map(clubId => ({
          club_id: clubId,
          user_id: currentUser.id,
          last_read_timestamp: localReadTimes.current.clubs[clubId] || new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('club_messages_read')
          .upsert(upsertItems, {
            onConflict: 'club_id,user_id',
            ignoreDuplicates: false
          });
          
        if (error) {
          // Only throw if it's not a duplicate error
          if (error.code !== '23505') {
            throw error;
          }
        }
        
        // Clear processed items from the pending set
        batch.forEach(id => {
          pendingMarkAsRead.current.clubs.delete(id);
          // Reset retry count on success
          if (retryCount.current.clubs[id]) {
            delete retryCount.current.clubs[id];
          }
        });
      }
      
      // Notify that messages have been marked as read
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
        detail: { type: 'club', batched: true }
      }));
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error marking clubs as read:', error);
      
      // Handle retries for failed clubs
      clubsToMark.forEach(id => {
        if (!retryCount.current.clubs[id]) {
          retryCount.current.clubs[id] = 1;
        } else {
          retryCount.current.clubs[id]++;
        }
        
        // Remove from pending if max retries reached
        if (retryCount.current.clubs[id] > MAX_RETRIES) {
          console.log(`[useCoalescedReadStatus] Max retries reached for club ${id}, removing from pending`);
          pendingMarkAsRead.current.clubs.delete(id);
        }
      });
      
      // Only show toast if we've reached max retries
      const failedIds = clubsToMark.filter(id => retryCount.current.clubs[id] >= MAX_RETRIES);
      if (failedIds.length > 0) {
        toast({
          title: "Error updating message status",
          description: "Some messages couldn't be marked as read. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  }, 500), [currentUser?.id]); // Increased debounce to 500ms for better batching
  
  // Mark a conversation as read - update local storage first, then queue database update
  const markConversationAsRead = useCallback((conversationId: string, immediate: boolean = false) => {
    if (!currentUser?.id || !conversationId) return;
    
    console.log(`[useCoalescedReadStatus] Marking conversation as read: ${conversationId}, immediate: ${immediate}`);
    
    // Immediately update local storage
    const timestamp = new Date().toISOString();
    localReadTimes.current.conversations[conversationId] = timestamp;
    saveLocalReadTimes();
    
    // Optimistically update the UI immediately via an event
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
      detail: { type: 'dm', id: conversationId }
    }));
    
    // Add to pending set for database sync
    pendingMarkAsRead.current.conversations.add(conversationId);
    
    // Process the database update (debounced or immediate)
    if (immediate) {
      processConversationMarks.flush?.();
    } else {
      processConversationMarks();
    }
  }, [currentUser?.id, processConversationMarks, saveLocalReadTimes]);
  
  // Mark a club as read - update local storage first, then queue database update
  const markClubAsRead = useCallback((clubId: string, immediate: boolean = false) => {
    if (!currentUser?.id || !clubId) return;
    
    console.log(`[useCoalescedReadStatus] Marking club as read: ${clubId}, immediate: ${immediate}`);
    
    // Immediately update local storage
    const timestamp = new Date().toISOString();
    localReadTimes.current.clubs[clubId] = timestamp;
    saveLocalReadTimes();
    
    // Optimistically update the UI immediately via an event
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
      detail: { type: 'club', id: clubId }
    }));
    
    // Add to pending set for database sync
    pendingMarkAsRead.current.clubs.add(clubId);
    
    // Process the database update (debounced or immediate)
    if (immediate) {
      processClubMarks.flush?.();
    } else {
      processClubMarks();
    }
  }, [currentUser?.id, processClubMarks, saveLocalReadTimes]);
  
  // Add method to check if a conversation/club has been read based on local storage
  const isConversationRead = useCallback((conversationId: string, messageTimestamp: string): boolean => {
    const lastReadTime = localReadTimes.current.conversations[conversationId];
    if (!lastReadTime) return false;
    
    return new Date(lastReadTime) >= new Date(messageTimestamp);
  }, []);
  
  const isClubRead = useCallback((clubId: string, messageTimestamp: string): boolean => {
    const lastReadTime = localReadTimes.current.clubs[clubId];
    if (!lastReadTime) return false;
    
    return new Date(lastReadTime) >= new Date(messageTimestamp);
  }, []);
  
  return {
    markConversationAsRead,
    markClubAsRead,
    isConversationRead,
    isClubRead,
    
    // Add method to get last read timestamp from local storage
    getLastReadTimestamp: useCallback((type: 'dm' | 'club', id: string): string | null => {
      if (type === 'dm') {
        return localReadTimes.current.conversations[id] || null;
      } else {
        return localReadTimes.current.clubs[id] || null;
      }
    }, [])
  };
};
