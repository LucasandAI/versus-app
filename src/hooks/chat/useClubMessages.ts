
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

  // Effect to handle real-time subscriptions and initial message loading
  useEffect(() => {
    if (!userClubs.length) return;
    
    // Only set up subscriptions when the drawer is open
    if (!isOpen) {
      console.log('[useClubMessages] Chat drawer is closed, not setting up subscriptions');
      return;
    }
    
    console.log('[useClubMessages] Chat drawer opened, setting up subscriptions for clubs:', userClubs.length);
    
    // Create channels for each club
    const channels = userClubs.map(club => {
      console.log(`[useClubMessages] Creating channel for club ${club.id}`);
      
      const channel = supabase.channel(`club-messages-${club.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, async (payload) => {
          console.log(`[Realtime] New club message received for club ${club.id}:`, payload);
          
          try {
            // Fetch sender information immediately for the new message
            const { data: sender, error } = await supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (error) {
              console.error('[useClubMessages] Error fetching sender:', error);
              return;
            }
            
            // Create complete message with sender info
            const completeMessage = {
              ...payload.new,
              sender
            };
            
            // Update state with the new message
            setClubMessages(currentMessages => {
              const existingMessages = currentMessages[club.id] || [];
              
              // Check for duplicates to prevent double-adding messages
              if (existingMessages.some(msg => msg.id === completeMessage.id)) {
                console.log(`[useClubMessages] Message ${completeMessage.id} already exists, skipping`);
                return currentMessages;
              }
              
              console.log(`[useClubMessages] Adding new message to club ${club.id}:`, completeMessage);
              
              // Return updated messages with the new message appended
              return {
                ...currentMessages,
                [club.id]: [...existingMessages, completeMessage]
              };
            });
            
            // Handle unread count
            const { data: { user } } = await supabase.auth.getUser();
            if (payload.new.sender_id !== user?.id && setUnreadMessages && document.hidden) {
              setUnreadMessages(1);
            }
          } catch (error) {
            console.error('[useClubMessages] Error processing new message:', error);
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
            const existingMessages = prev[club.id] || [];
            return {
              ...prev,
              [club.id]: existingMessages.filter(msg => msg.id !== payload.old.id)
            };
          });
        });

      // Subscribe to the channel with enhanced status logging
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useClubMessages] Successfully subscribed to club ${club.id} messages`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useClubMessages] Error subscribing to club ${club.id} messages`);
        } else {
          console.log(`[useClubMessages] Channel status for club ${club.id}:`, status);
        }
      });

      return channel;
    });
    
    // Fetch initial messages for each club
    const fetchClubMessages = async () => {
      console.log('[useClubMessages] Fetching messages for all clubs');
      
      try {
        const messagesPromises = userClubs.map(async (club) => {
          console.log(`[useClubMessages] Fetching messages for club ${club.id}`);
          
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
          
          console.log(`[useClubMessages] Successfully fetched ${data?.length || 0} messages for club ${club.id}`);
          return [club.id, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
          if (typeof clubId === 'string') {
            clubMessagesMap[clubId] = Array.isArray(messages) ? messages : [];
          }
        });
        
        // Set the messages in state
        setClubMessages(clubMessagesMap);
        console.log('[useClubMessages] Updated clubMessages state:', 
          Object.keys(clubMessagesMap).map(key => `${key}: ${clubMessagesMap[key]?.length || 0} messages`));
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

    // Cleanup subscriptions when drawer closes or component unmounts
    return () => {
      console.log('[useClubMessages] Cleaning up subscriptions');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [userClubs, isOpen, setUnreadMessages]); // Re-run when isOpen changes

  return {
    clubMessages,
    setClubMessages,
  };
};
