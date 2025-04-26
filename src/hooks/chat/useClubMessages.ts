import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useClubMessages = (
  userClubs: Club[],
  isOpen: boolean,
  setUnreadMessages?: (count: number) => void
) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const cleanupRef = useRef<() => void | undefined>();

  useEffect(() => {
    if (!isOpen) {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!userClubs.length) return;
    
    if (!isOpen) {
      console.log('[useClubMessages] Chat drawer is closed, not setting up subscriptions');
      return;
    }
    
    console.log('[useClubMessages] Chat drawer opened, setting up subscriptions for clubs:', userClubs.length);
    
    activeSubscriptionsRef.current = {};
    
    const channels = userClubs.map(club => {
      if (activeSubscriptionsRef.current[club.id]) {
        console.log(`[useClubMessages] Subscription already exists for club ${club.id}, skipping`);
        return null;
      }
      
      console.log(`[useClubMessages] Creating channel for club ${club.id}`);
      activeSubscriptionsRef.current[club.id] = true;
      
      const channel = supabase.channel(`club-messages-${club.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, async (payload) => {
          console.log(`[Realtime] New club message received for club ${club.id}:`, payload);
          
          try {
            const { data: sender, error } = await supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (error) {
              console.error('[useClubMessages] Error fetching sender:', error);
              return;
            }
            
            const completeMessage = {
              ...payload.new,
              sender
            };
            
            setClubMessages(currentMessages => {
              const existingMessages = currentMessages[club.id] || [];
              
              if (existingMessages.some(msg => msg.id === payload.new.id)) {
                console.log(`[useClubMessages] Message ${payload.new.id} already exists, skipping`);
                return currentMessages;
              }
              
              console.log(`[useClubMessages] Adding new message to club ${club.id}:`, completeMessage);
              
              return {
                ...currentMessages,
                [club.id]: [...existingMessages, completeMessage]
              };
            });
            
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
    }).filter(Boolean);
    
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

    cleanupRef.current = () => {
      console.log('[useClubMessages] Cleaning up subscriptions');
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      activeSubscriptionsRef.current = {};
    };

    return cleanupRef.current;
  }, [userClubs, isOpen, setUnreadMessages]);

  const safeSetClubMessages = useCallback((
    updater: React.SetStateAction<Record<string, any[]>>
  ) => {
    setClubMessages(prevState => {
      const nextState = typeof updater === 'function' 
        ? updater(prevState) 
        : updater;
      
      console.log('[useClubMessages] State update:', {
        prevClubIds: Object.keys(prevState),
        nextClubIds: Object.keys(nextState)
      });
      
      return nextState;
    });
  }, []);

  return {
    clubMessages,
    setClubMessages: safeSetClubMessages,
  };
};
