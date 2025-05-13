
import { useCallback, useEffect, useState } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface ClubConversation {
  club: Club;
  lastMessage: {
    id: string;
    club_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
    sender_name?: string;
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
  } | null;
}

export function useClubConversations(clubs: Club[]) {
  const [clubConversations, setClubConversations] = useState<ClubConversation[]>([]);

  const fetchLastMessages = useCallback(async () => {
    try {
      if (!clubs.length) return [];
      
      const clubIds = clubs.map(club => club.id);
      
      // Get the most recent message for each club
      const { data: lastMessagesData, error: messagesError } = await supabase
        .from('club_chat_messages')
        .select(`
          id,
          club_id,
          sender_id,
          message,
          timestamp,
          sender:sender_id (
            id,
            name,
            avatar
          )
        `)
        .in('club_id', clubIds)
        .order('timestamp', { ascending: false });

      if (messagesError) {
        console.error('[useClubConversations] Error fetching messages:', messagesError);
        return [];
      }

      // Group by club_id and take the first (most recent) message for each club
      const latestMessagesMap: Record<string, any> = {};
      
      if (lastMessagesData) {
        lastMessagesData.forEach(message => {
          if (!latestMessagesMap[message.club_id] || 
              new Date(message.timestamp) > new Date(latestMessagesMap[message.club_id].timestamp)) {
            latestMessagesMap[message.club_id] = message;
          }
        });
      }

      // Create club conversations with last messages
      const updatedConversations = clubs.map(club => ({
        club,
        lastMessage: latestMessagesMap[club.id] || null
      }));

      // Sort by most recent message timestamp
      return updatedConversations.sort((a, b) => {
        const aTimestamp = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const bTimestamp = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return bTimestamp - aTimestamp;
      });
    } catch (error) {
      console.error('[useClubConversations] Error in fetchLastMessages:', error);
      return [];
    }
  }, [clubs]);

  // Initial fetch of last messages
  useEffect(() => {
    const loadConversations = async () => {
      const conversations = await fetchLastMessages();
      setClubConversations(conversations);
    };

    loadConversations();
  }, [fetchLastMessages]);

  // Subscribe to message updates
  useEffect(() => {
    if (!clubs.length) return;

    const channel = supabase
      .channel('club_conversation_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'club_chat_messages' },
        async (payload) => {
          // Make sure payload.new or payload.old exists and has club_id
          const messageClubId = payload.new?.club_id || payload.old?.club_id;
          
          if (!messageClubId) return;
          
          // Check if this club belongs to our list
          const isRelevantClub = clubs.some(club => club.id === messageClubId);
          if (!isRelevantClub) return;
          
          // Refetch all conversations to ensure we have the latest data
          const conversations = await fetchLastMessages();
          setClubConversations(conversations);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs, fetchLastMessages]);

  return clubConversations;
}
