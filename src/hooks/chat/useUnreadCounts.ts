import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useUnreadCounts = () => {
  const [dmUnreadCount, setDMUnreadCount] = useState(0);
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  
  const { currentUser, isSessionReady } = useApp();
  const userId = currentUser?.id;

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!userId) return;
    
    // Optimistic update of UI
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      updated.delete(clubId);
      return updated;
    });
    
    setClubUnreadCount(prev => Math.max(0, prev - 1));
    
    // Dispatch event to update global unread count
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: userId,
          club_id: clubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[useUnreadCounts] Error marking club messages as read:', error);
      
      // Revert optimistic update on error
      setUnreadClubs(prev => {
        const reverted = new Set(prev);
        reverted.add(clubId);
        return reverted;
      });
      
      setClubUnreadCount(prev => prev + 1);
    }
  }, [userId]);

  // Listen for unread message updates
  useEffect(() => {
    const handleUnreadMessagesUpdated = (e: CustomEvent) => {
      const { clubId, unreadCount, isUnread } = e.detail || {};
      
      if (clubId) {
        // Update club-specific unread state
        setUnreadClubs(prev => {
          const updated = new Set(prev);
          if (isUnread) {
            updated.add(clubId);
          } else {
            updated.delete(clubId);
          }
          return updated;
        });
        
        // Update total club unread count
        if (unreadCount !== undefined) {
          setClubUnreadCount(prev => {
            if (isUnread) {
              return prev + unreadCount;
            } else {
              return Math.max(0, prev - unreadCount);
            }
          });
        }
      }
    };

    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated as EventListener);

    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isSessionReady || !userId) return;

    // Only set up subscriptions when authenticated
    const dmChannel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        if (payload.new.receiver_id === userId) {
          setDMUnreadCount(prev => prev + 1);
          setUnreadConversations(prev => new Set([...prev, payload.new.conversation_id]));
          
          // Dispatch global event to notify other parts of the app
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        }
      })
      .subscribe();

    const clubChannel = supabase.channel('club-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, (payload) => {
        if (payload.new.sender_id !== userId) {
          // Update unread count immediately
          setClubUnreadCount(prev => prev + 1);
          setUnreadClubs(prev => new Set([...prev, payload.new.club_id]));
          
          // Dispatch events for immediate UI updates
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
            detail: {
              clubId: payload.new.club_id,
              unreadCount: 1,
              isUnread: true
            }
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [userId, isSessionReady]);

  return {
    totalUnreadCount: dmUnreadCount + clubUnreadCount,
    dmUnreadCount,
    clubUnreadCount,
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead
  };
};
