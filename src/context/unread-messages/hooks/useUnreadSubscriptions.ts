
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  // Use refs to store handler functions to avoid closures with stale data
  const handlersRef = useRef({
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  // Track active conversations to prevent marking them as unread
  // This will be updated via custom events
  const activeConversationsRef = useRef<Set<string>>(new Set());
  const activeClubsRef = useRef<Set<string>>(new Set());
  
  // Listen for received messages to update unread status
  useEffect(() => {
    const handleDMReceived = (e: CustomEvent) => {
      const { conversationId, shouldMarkUnread } = e.detail;
      
      // Only mark as unread if specifically told to and it's not an active conversation
      if (shouldMarkUnread && !activeConversationsRef.current.has(conversationId)) {
        console.log(`[useUnreadSubscriptions] Marking conversation ${conversationId} as unread from message event`);
        handlersRef.current.markConversationAsUnread(conversationId);
      }
    };
    
    const handleClubMessageReceived = (e: CustomEvent) => {
      const { clubId, shouldMarkUnread } = e.detail;
      
      // Only mark as unread if specifically told to and it's not an active club
      if (shouldMarkUnread && !activeClubsRef.current.has(clubId)) {
        console.log(`[useUnreadSubscriptions] Marking club ${clubId} as unread from message event`);
        handlersRef.current.markClubAsUnread(clubId);
      }
    };
    
    window.addEventListener('dmMessageReceived', handleDMReceived as EventListener);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('dmMessageReceived', handleDMReceived as EventListener);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, []);
  
  // Setup event listeners for active conversation tracking
  useEffect(() => {
    const handleConversationActive = (e: CustomEvent) => {
      if (e.detail?.conversationId) {
        console.log('[useUnreadSubscriptions] Conversation active:', e.detail.conversationId);
        activeConversationsRef.current.add(e.detail.conversationId);
      }
    };
    
    const handleClubActive = (e: CustomEvent) => {
      if (e.detail?.clubId) {
        console.log('[useUnreadSubscriptions] Club active:', e.detail.clubId);
        activeClubsRef.current.add(e.detail.clubId);
      }
    };
    
    const handleConversationInactive = (e: CustomEvent) => {
      if (e.detail?.conversationId && activeConversationsRef.current.has(e.detail.conversationId)) {
        console.log('[useUnreadSubscriptions] Conversation inactive:', e.detail.conversationId);
        activeConversationsRef.current.delete(e.detail.conversationId);
      }
    };
    
    const handleClubInactive = (e: CustomEvent) => {
      if (e.detail?.clubId && activeClubsRef.current.has(e.detail.clubId)) {
        console.log('[useUnreadSubscriptions] Club inactive:', e.detail.clubId);
        activeClubsRef.current.delete(e.detail.clubId);
      }
    };
    
    window.addEventListener('conversationActive', handleConversationActive as EventListener);
    window.addEventListener('clubActive', handleClubActive as EventListener);
    window.addEventListener('conversationInactive', handleConversationInactive as EventListener);
    window.addEventListener('clubInactive', handleClubInactive as EventListener);
    
    return () => {
      window.removeEventListener('conversationActive', handleConversationActive as EventListener);
      window.removeEventListener('clubActive', handleClubActive as EventListener);
      window.removeEventListener('conversationInactive', handleConversationInactive as EventListener);
      window.removeEventListener('clubInactive', handleClubInactive as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<string>();
    let pendingClubUpdates = new Set<string>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with RAF to avoid flickering
    const processUpdates = () => {
      // Process direct message updates
      if (pendingUpdates.size > 0) {
        console.log('[useUnreadSubscriptions] Processing DM updates:', Array.from(pendingUpdates));
        
        pendingUpdates.forEach(conversationId => {
          // Skip if conversation is currently active/open
          if (activeConversationsRef.current.has(conversationId)) {
            console.log('[useUnreadSubscriptions] Skipping active conversation:', conversationId);
            return;
          }
          handlersRef.current.markConversationAsUnread(conversationId);
        });
        pendingUpdates.clear();
      }
      
      // Process club updates
      if (pendingClubUpdates.size > 0) {
        console.log('[useUnreadSubscriptions] Processing club updates:', Array.from(pendingClubUpdates));
        
        pendingClubUpdates.forEach(clubId => {
          // Skip if club is currently active/open
          if (activeClubsRef.current.has(clubId)) {
            console.log('[useUnreadSubscriptions] Skipping active club:', clubId);
            return;
          }
          handlersRef.current.markClubAsUnread(clubId);
        });
        pendingClubUpdates.clear();
      }
      
      // Dispatch unread messages updated event
      // This needs to happen even if we filtered out all updates due to active conversations
      // So that other components know to check their unread counts
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
        detail: { timestamp: Date.now() }
      }));
      
      updateTimeout = null;
    };
    
    // Queue an update with debouncing
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 50); // Reduced from 100ms to 50ms for faster response
    };
    
    // Set up real-time subscriptions for new messages
    const dmChannel = supabase
      .channel('global-dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.receiver_id === currentUserId) {
              console.log('[useUnreadSubscriptions] New DM detected:', payload.new.conversation_id);
              
              // Skip if conversation is currently active/open
              if (activeConversationsRef.current.has(payload.new.conversation_id)) {
                console.log('[useUnreadSubscriptions] Skipping active conversation:', payload.new.conversation_id);
                return;
              }
              
              // Queue the update
              pendingUpdates.add(payload.new.conversation_id);
              queueUpdate();
            }
          })
      .subscribe();
    
    // Subscribe to new club messages
    const clubChannel = supabase.channel('global-club-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (payload.new.sender_id !== currentUserId) {
              console.log('[useUnreadSubscriptions] New club message detected:', payload.new.club_id);
              
              // Skip if club is currently active/open
              if (activeClubsRef.current.has(payload.new.club_id)) {
                console.log('[useUnreadSubscriptions] Skipping active club:', payload.new.club_id);
                return;
              }
              
              // Queue the update
              pendingClubUpdates.add(payload.new.club_id);
              queueUpdate();
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
      
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [currentUserId, isSessionReady]);
};
