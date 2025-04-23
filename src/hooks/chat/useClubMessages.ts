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
          console.log(`[useClubMessages] Received new message for club ${club.id}:`, payload);
          
          // Immediately update the UI with the new message
          setClubMessages(prev => {
            const existingMessages = prev[club.id] || [];
            // Don't add if message already exists (prevent duplicates)
            if (existingMessages.some(msg => msg.id === payload.new.id)) {
              console.log(`[useClubMessages] Message ${payload.new.id} already exists, skipping`);
              return prev;
            }
            
            console.log(`[useClubMessages] Adding new message to club ${club.id}`);
            return {
              ...prev,
              [club.id]: [...existingMessages, payload.new]
            };
          });

          // Handle unread count in a separate async function
          const updateUnreadCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (payload.new.sender_id !== user?.id && setUnreadMessages && document.hidden) {
              setUnreadMessages(1);
            }
          };
          updateUnreadCount();
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, (payload) => {
          console.log(`[useClubMessages] Message deleted from club ${club.id}:`, payload);
          
          setClubMessages(prev => {
            const existingMessages = prev[club.id] || [];
            return {
              ...prev,
              [club.id]: existingMessages.filter(msg => msg.id !== payload.old.id)
            };
          });
        });

      // Subscribe to the channel with status logging
      channel.subscribe((status) => {
        console.log(`[useClubMessages] Channel status for club ${club.id}:`, status);
      });

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
