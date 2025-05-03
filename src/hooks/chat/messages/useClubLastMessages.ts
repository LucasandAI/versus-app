
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [sortedClubs, setSortedClubs] = useState<Club[]>([]);
  const { unreadClubs } = useUnreadMessages();
  
  // Sort clubs by most recent message and unread status
  const sortClubsByActivityAndUnread = useCallback((messages: Record<string, any>) => {
    if (!clubs.length) return [];
    
    const clubsWithData = clubs.map(club => {
      const lastMessage = messages[club.id];
      const hasUnread = unreadClubs.has(club.id);
      
      // Use the message timestamp or a default old date if no messages
      const lastTimestamp = lastMessage ? 
        new Date(lastMessage.timestamp).getTime() : 
        0;
      
      return {
        club,
        lastTimestamp,
        hasUnread
      };
    });
    
    // Sort - unread first, then by timestamp
    return clubsWithData
      .sort((a, b) => {
        // Unread clubs always come first
        if (a.hasUnread && !b.hasUnread) return -1;
        if (!a.hasUnread && b.hasUnread) return 1;
        
        // Then sort by timestamp
        return b.lastTimestamp - a.lastTimestamp;
      })
      .map(item => item.club);
  }, [clubs, unreadClubs]);

  // Fetch initial messages
  useEffect(() => {
    if (!clubs.length) {
      setSortedClubs([]);
      return;
    }

    const fetchLatestMessages = async () => {
      try {
        const clubIds = clubs.map(club => club.id);
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            *,
            sender:sender_id (
              id,
              name
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('[useClubLastMessages] Error fetching messages:', error);
          return;
        }

        // Group messages by club_id and take only the most recent one
        const latestMessages = data.reduce((acc: Record<string, any>, message) => {
          if (!acc[message.club_id] || 
              new Date(message.timestamp) > new Date(acc[message.club_id].timestamp)) {
            acc[message.club_id] = message;
          }
          return acc;
        }, {});

        setLastMessages(latestMessages);
        setSortedClubs(sortClubsByActivityAndUnread(latestMessages));
      } catch (error) {
        console.error('[useClubLastMessages] Error in fetch:', error);
      }
    };

    fetchLatestMessages();
  }, [clubs, sortClubsByActivityAndUnread]);

  // Listen for new messages to update last messages and sort order
  useEffect(() => {
    const handleNewMessage = (e: CustomEvent) => {
      const { clubId, message } = e.detail;
      
      if (!clubId || !message) return;
      
      console.log('[useClubLastMessages] Received new message for club:', clubId);
      
      // Update last message for this club
      setLastMessages(prev => {
        const currentLastMessage = prev[clubId];
        
        // Only update if this is newer than current last message
        if (!currentLastMessage || 
            new Date(message.timestamp) > new Date(currentLastMessage.timestamp)) {
          const updated = { ...prev, [clubId]: message };
          
          // Re-sort clubs when last messages change
          setSortedClubs(sortClubsByActivityAndUnread(updated));
          return updated;
        }
        
        return prev;
      });
    };
    
    // Listen for new messages
    window.addEventListener('clubMessageReceived', handleNewMessage as EventListener);
    
    // Listen for unread status changes to re-sort
    const handleUnreadChanges = () => {
      setSortedClubs(sortClubsByActivityAndUnread(lastMessages));
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadChanges);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleNewMessage as EventListener);
      window.removeEventListener('unreadMessagesUpdated', handleUnreadChanges);
    };
  }, [lastMessages, sortClubsByActivityAndUnread]);

  return { 
    lastMessages,
    sortedClubs: sortedClubs.length > 0 ? sortedClubs : clubs
  };
};
