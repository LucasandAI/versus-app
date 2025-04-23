
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useClubMessages = (
  userClubs: Club[],
  isOpen: boolean,
  setUnreadMessages?: (count: number) => void
) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!userClubs.length || !isOpen) return;
    
    console.log('[useClubMessages] Setting up real-time subscriptions for clubs:', userClubs.length);
    
    // Create channels for each club
    const channels = userClubs.map(club => {
      const channel = supabase.channel(`club-messages-${club.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, (payload) => {
          console.log(`[useClubMessages] New message for club ${club.id}:`, payload);
          
          setClubMessages(prev => {
            const clubMessages = prev[club.id] || [];
            if (clubMessages.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            return {
              ...prev,
              [club.id]: [...clubMessages, payload.new]
            };
          });

          // Update unread count if message is from another user
          if (payload.new.sender_id !== supabase.auth.getUser()?.data?.user?.id) {
            setUnreadMessages?.(prevCount => (prevCount || 0) + 1);
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, (payload) => {
          console.log(`[useClubMessages] Message deleted from club ${club.id}:`, payload);
          
          setClubMessages(prev => {
            const clubMessages = prev[club.id] || [];
            return {
              ...prev,
              [club.id]: clubMessages.filter(msg => msg.id !== payload.old.id)
            };
          });
        })
        .subscribe();

      return channel;
    });
    
    // Fetch initial messages for each club
    const fetchClubMessages = async () => {
      try {
        const messagesPromises = userClubs.map(async (club) => {
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              timestamp, 
              sender_id, 
              club_id,
              sender:sender_id(id, name, avatar)
            `)
            .eq('club_id', club.id)
            .order('timestamp', { ascending: true });
              
          if (error) {
            console.error(`[useClubMessages] Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          return [club.id, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
          if (typeof clubId === 'string') {
            clubMessagesMap[clubId] = Array.isArray(messages) ? messages : [];
          }
        });
        
        setClubMessages(clubMessagesMap);
      } catch (error) {
        console.error('[useClubMessages] Error fetching club messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };
    
    fetchClubMessages();

    // Cleanup subscriptions
    return () => {
      console.log('[useClubMessages] Cleaning up subscriptions');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [userClubs, isOpen, setUnreadMessages]);

  return {
    clubMessages,
    setClubMessages,
  };
};
