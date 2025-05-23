
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isConversationActive, refreshActiveTimestamp } from '@/utils/chat/activeConversationTracker';
import { isClubReadSince, isDmReadSince, getReadTimestamp } from '@/utils/chat/readStatusStorage';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string, messageTimestamp?: number) => void;
  markClubAsUnread: (clubId: string, messageTimestamp?: number) => void;
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
  
  // Track message processing state to prevent duplicate processing
  const processingMessagesRef = useRef<Set<string>>(new Set());
  
  // Track unread counts locally for the first message case
  const [localUnreadClubs] = useState<Set<string>>(new Set());
  const [localUnreadConversations] = useState<Set<string>>(new Set());

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  // Handle badge refresh events
  useEffect(() => {
    const handleBadgeRefresh = (event: CustomEvent) => {
      const { immediate, forceTotalRecalculation } = event.detail || {};
      
      if (forceTotalRecalculation) {
        // Force a full refresh of unread counts
        console.log('[useUnreadSubscriptions] Forcing total unread count recalculation');
        setTimeout(() => {
          handlersRef.current.fetchUnreadCounts();
        }, 50);
      } else if (immediate) {
        // Quick badge refresh
        console.log('[useUnreadSubscriptions] Immediate badge refresh requested');
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
    };
    
    window.addEventListener('badge-refresh-required', handleBadgeRefresh as EventListener);
    
    return () => {
      window.removeEventListener('badge-refresh-required', handleBadgeRefresh as EventListener);
    };
  }, []);
  
  // Handle conversation open events (to immediately refresh badges)
  useEffect(() => {
    const handleConversationOpened = (event: CustomEvent) => {
      const { type, id } = event.detail || {};
      
      if (!type || !id) return;
      
      console.log(`[useUnreadSubscriptions] Conversation opened: ${type} ${id}`);
      
      // Force an immediate badge refresh
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      // For club conversations, also notify about read status change
      if (type === 'club') {
        window.dispatchEvent(new CustomEvent('club-read-status-changed', {
          detail: { clubId: id }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('dm-read-status-changed', {
          detail: { conversationId: id }
        }));
      }
    };
    
    window.addEventListener('conversation-opened', handleConversationOpened as EventListener);
    
    return () => {
      window.removeEventListener('conversation-opened', handleConversationOpened as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<{ id: string, timestamp?: number, messageId?: string }>();
    let pendingClubUpdates = new Set<{ id: string, timestamp?: number, messageId?: string }>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with RAF to avoid flickering
    const processUpdates = () => {
      if (pendingUpdates.size > 0) {
        pendingUpdates.forEach(update => {
          // Skip if this message is already being processed
          if (update.messageId && processingMessagesRef.current.has(update.messageId)) {
            return;
          }
          
          // Mark as being processed
          if (update.messageId) {
            processingMessagesRef.current.add(update.messageId);
          }
          
          // Double-check if conversation is active before marking as unread
          // Add a small delay to ensure the active state has been properly set
          setTimeout(() => {
            const isActive = isConversationActive('dm', update.id);
            console.log(`[useUnreadSubscriptions] Checking if DM ${update.id} is active: ${isActive}`);
            
            if (!isActive) {
              // Also check if it's been read locally since this message
              if (!update.timestamp || !isDmReadSince(update.id, update.timestamp)) {
                handlersRef.current.markConversationAsUnread(update.id, update.timestamp);
                localUnreadConversations.add(update.id);
              }
            } else {
              // If conversation is active, refresh the timestamp to prevent races
              refreshActiveTimestamp('dm', update.id);
            }
            
            // Remove from processing set after a short delay
            if (update.messageId) {
              setTimeout(() => {
                processingMessagesRef.current.delete(update.messageId as string);
              }, 5000); // Keep in set for 5 seconds to prevent duplicate processing
            }
          }, 100); // Small delay to allow for active state to be set
        });
        pendingUpdates.clear();
      }
      
      if (pendingClubUpdates.size > 0) {
        pendingClubUpdates.forEach(update => {
          // Skip if this message is already being processed
          if (update.messageId && processingMessagesRef.current.has(update.messageId)) {
            return;
          }
          
          // Mark as being processed
          if (update.messageId) {
            processingMessagesRef.current.add(update.messageId);
          }
          
          // Small delay to ensure active state is properly set
          setTimeout(() => {
            const isActive = isConversationActive('club', update.id);
            console.log(`[useUnreadSubscriptions] Checking if club ${update.id} is active: ${isActive}`);
            
            if (!isActive) {
              // Also check if it's been read locally since this message
              if (!update.timestamp || !isClubReadSince(update.id, update.timestamp)) {
                handlersRef.current.markClubAsUnread(update.id, update.timestamp);
                localUnreadClubs.add(update.id);
              }
            } else {
              // If club is active, refresh the timestamp to prevent races
              refreshActiveTimestamp('club', update.id);
            }
            
            // Remove from processing set after a short delay
            if (update.messageId) {
              setTimeout(() => {
                processingMessagesRef.current.delete(update.messageId as string);
              }, 5000); // Keep in set for 5 seconds to prevent duplicate processing
            }
          }, 100); // Small delay to allow for active state to be set
        });
        pendingClubUpdates.clear();
      }
      
      // Only dispatch one event regardless of how many updates
      if (pendingUpdates.size > 0 || pendingClubUpdates.size > 0) {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
      
      updateTimeout = null;
    };
    
    // Queue an update with debouncing
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 200); // Slightly longer delay to allow for active state to be set
    };
    
    // Handle club message events (including the first message case)
    const handleUnreadClubMessage = (event: CustomEvent) => {
      const { clubId, messageTimestamp, messageId } = event.detail || {};
      
      if (!clubId) return;
      
      // Skip if this message is already being processed
      if (messageId && processingMessagesRef.current.has(messageId)) {
        return;
      }
      
      // Check if it's the first unread message for this club
      const isFirstUnread = !localUnreadClubs.has(clubId);
      
      // Check for active conversation immediately
      const isActive = isConversationActive('club', clubId);
      console.log(`[useUnreadSubscriptions] Club message received. Club ${clubId} active: ${isActive}`);
      
      // If conversation is active, just refresh timestamp and exit
      if (isActive) {
        refreshActiveTimestamp('club', clubId);
        return;
      }
      
      // If this is the first unread message, handle it specially
      if (isFirstUnread) {
        console.log(`[useUnreadSubscriptions] First unread message for club ${clubId}`);
        
        // Add a short delay to make sure active status is correct
        setTimeout(() => {
          // Double-check active status
          if (!isConversationActive('club', clubId)) {
            if (!messageTimestamp || !isClubReadSince(clubId, messageTimestamp)) {
              // Add to processing set
              if (messageId) {
                processingMessagesRef.current.add(messageId);
              }
              
              handlersRef.current.markClubAsUnread(clubId, messageTimestamp);
              localUnreadClubs.add(clubId);
              
              // Force an immediate badge refresh
              window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
              
              // Remove from processing set after a short delay
              if (messageId) {
                setTimeout(() => {
                  processingMessagesRef.current.delete(messageId);
                }, 5000);
              }
            }
          }
        }, 100); // Small delay to ensure active state is properly set
      } else {
        // For subsequent messages, use the normal batching process
        pendingClubUpdates.add({
          id: clubId,
          timestamp: messageTimestamp,
          messageId
        });
        queueUpdate();
      }
    };
    
    window.addEventListener('unread-club-message', handleUnreadClubMessage as EventListener);
    
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
            if (payload.new.receiver_id === currentUserId && payload.new.sender_id !== currentUserId) {
              console.log('[useUnreadSubscriptions] New DM detected:', payload.new.id);
              
              // Skip if this message is already being processed
              if (processingMessagesRef.current.has(payload.new.id)) {
                return;
              }
              
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Check if it's the first unread message for this conversation
              const isFirstUnread = !localUnreadConversations.has(payload.new.conversation_id);
              
              // Check for active conversation immediately
              const isActive = isConversationActive('dm', payload.new.conversation_id);
              console.log(`[useUnreadSubscriptions] DM received. Conversation ${payload.new.conversation_id} active: ${isActive}`);
              
              // If conversation is active, just refresh timestamp and exit
              if (isActive) {
                refreshActiveTimestamp('dm', payload.new.conversation_id);
                return;
              }
              
              if (isFirstUnread) {
                console.log(`[useUnreadSubscriptions] First unread message for DM ${payload.new.conversation_id}`);
                
                // Add a short delay to make sure active status is correct
                setTimeout(() => {
                  // Double-check active status
                  if (!isConversationActive('dm', payload.new.conversation_id)) {
                    if (!timestamp || !isDmReadSince(payload.new.conversation_id, timestamp)) {
                      // Add to processing set
                      processingMessagesRef.current.add(payload.new.id);
                      
                      handlersRef.current.markConversationAsUnread(payload.new.conversation_id, timestamp);
                      localUnreadConversations.add(payload.new.conversation_id);
                      
                      // Force an immediate badge refresh
                      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
                      
                      // Remove from processing set after a short delay
                      setTimeout(() => {
                        processingMessagesRef.current.delete(payload.new.id);
                      }, 5000);
                    }
                  }
                }, 100); // Small delay to ensure active state is properly set
              } else {
                // Queue the update instead of processing immediately
                pendingUpdates.add({
                  id: payload.new.conversation_id,
                  timestamp,
                  messageId: payload.new.id
                });
                queueUpdate();
              }
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
              console.log('[useUnreadSubscriptions] New club message detected:', payload.new.id);
              
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Check if this conversation is currently active
              if (!isConversationActive('club', payload.new.club_id)) {
                // Check if this message has been read locally already
                if (!isClubReadSince(payload.new.club_id, timestamp)) {
                  // Dispatch an unread club message event
                  window.dispatchEvent(new CustomEvent('unread-club-message', { 
                    detail: { 
                      clubId: payload.new.club_id,
                      messageTimestamp: timestamp,
                      messageId: payload.new.id
                    } 
                  }));
                }
              } else {
                // Refresh the active timestamp to prevent race conditions
                refreshActiveTimestamp('club', payload.new.club_id);
              }
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
    
    // Set up a periodic refresh for unread counts
    const refreshInterval = setInterval(() => {
      handlersRef.current.fetchUnreadCounts();
    }, 60000); // Every minute
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
      window.removeEventListener('unread-club-message', handleUnreadClubMessage as EventListener);
      clearInterval(refreshInterval);
      
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [currentUserId, isSessionReady, localUnreadClubs, localUnreadConversations]);
};
