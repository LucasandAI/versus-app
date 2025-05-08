import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = (
  currentUserId: string | undefined,
  isSessionReady: boolean
) => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const pendingUpdates = useRef(new Set<string>());
  const pendingClubUpdates = useRef(new Set<string>());
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Optimistic update function
  const updateUnreadCountsOptimistically = useCallback(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(() => {
      // Process DM updates
      pendingUpdates.current.forEach(conversationId => {
        setUnreadConversations(prev => {
          const updated = new Set(prev);
          updated.add(conversationId);
          return updated;
        });
        setDmUnreadCount(prev => prev + 1);
      });
      pendingUpdates.current.clear();

      // Process club updates
      pendingClubUpdates.current.forEach(clubId => {
        setUnreadClubs(prev => {
          const updated = new Set(prev);
          updated.add(clubId);
          return updated;
        });
        setClubUnreadCount(prev => prev + 1);
      });
      pendingClubUpdates.current.clear();

      // Dispatch global event for UI updates
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
    }, 100); // Small delay to batch updates
  }, []);

  // Mark messages as read optimistically
  const markMessagesAsReadOptimistically = useCallback((conversationId: string, type: 'dm' | 'club') => {
    if (type === 'dm') {
      setUnreadConversations(prev => {
        const updated = new Set(prev);
        updated.delete(conversationId);
        return updated;
      });
      setDmUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      setUnreadClubs(prev => {
        const updated = new Set(prev);
        updated.delete(conversationId);
        return updated;
      });
      setClubUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Dispatch global event for UI updates
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
  }, []);

  useEffect(() => {
    if (!currentUserId || !isSessionReady) return;

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
              // Queue the update instead of processing immediately
              pendingUpdates.current.add(payload.new.conversation_id);
              updateUnreadCountsOptimistically();
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
              // Queue the update instead of processing immediately
              pendingClubUpdates.current.add(payload.new.club_id);
              updateUnreadCountsOptimistically();
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
      
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [currentUserId, isSessionReady, updateUnreadCountsOptimistically]);

  return {
    unreadConversations,
    unreadClubs,
    dmUnreadCount,
    clubUnreadCount,
    markMessagesAsReadOptimistically
  };
};
