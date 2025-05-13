
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';

export interface ClubConversation {
  club: Club;
  lastMessage?: {
    message: string;
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
    sender_username?: string;
    timestamp: string;
  } | null;
}

interface MessagePayload {
  new: {
    club_id: string;
    message: string;
    sender_id: string;
    timestamp: string;
    [key: string]: any;
  };
}

export const useClubConversations = (clubs: Club[]): ClubConversation[] => {
  const [clubConversations, setClubConversations] = useState<ClubConversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const clubsRef = useRef<Club[]>(clubs);

  // Update the reference when clubs change
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // Fetch last messages for all clubs on mount and when clubs change
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (clubs.length === 0) return;

      try {
        const { data: messages, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id,
            message,
            sender_id,
            club_id,
            timestamp,
            sender:sender_id(id, name, avatar)
          `)
          .in('club_id', clubs.map(club => club.id))
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching club messages:', error);
          return;
        }

        // Group messages by club and get the last message for each
        const clubLastMessages: Record<string, any> = {};
        messages?.forEach(message => {
          if (message.club_id) {
            if (!clubLastMessages[message.club_id] || 
                new Date(message.timestamp) > new Date(clubLastMessages[message.club_id].timestamp)) {
              clubLastMessages[message.club_id] = message;
            }
          }
        });

        setLastMessages(clubLastMessages);
      } catch (error) {
        console.error('Failed to fetch last messages:', error);
      }
    };

    fetchLastMessages();
  }, [clubs]);

  // Subscribe to realtime updates for club messages
  useEffect(() => {
    const channel = supabase
      .channel('club-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages' 
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Type guard to check if payload has correct structure
          if (payload && payload.new && 'club_id' in payload.new) {
            const typedPayload = payload as unknown as MessagePayload;
            const clubId = typedPayload.new.club_id;
            
            // Check if this club is relevant to the user
            const isRelevantClub = clubsRef.current.some(club => club.id === clubId);
            if (!isRelevantClub) return;

            // Update with the new message
            setLastMessages(prev => ({
              ...prev,
              [clubId]: typedPayload.new
            }));
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Combine clubs with their last messages
  useEffect(() => {
    const conversations: ClubConversation[] = clubs.map(club => {
      const lastMessage = lastMessages[club.id];
      return {
        club,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          sender: lastMessage.sender,
          sender_username: lastMessage.sender?.name || 'Unknown',
          timestamp: lastMessage.timestamp
        } : null
      };
    });

    setClubConversations(conversations);
  }, [clubs, lastMessages]);

  return clubConversations;
};
