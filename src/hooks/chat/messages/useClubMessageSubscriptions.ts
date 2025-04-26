
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const cleanupRef = useRef<() => void | undefined>();

  useEffect(() => {
    if (!isOpen) {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      return;
    }

    if (!userClubs.length) return;
    
    console.log('[useClubMessageSubscriptions] Setting up subscriptions for clubs:', userClubs.length);
    
    activeSubscriptionsRef.current = {};
    
    const channels = userClubs.map(club => {
      if (activeSubscriptionsRef.current[club.id]) {
        console.log(`[useClubMessageSubscriptions] Subscription exists for club ${club.id}`);
        return null;
      }
      
      console.log(`[useClubMessageSubscriptions] Creating channel for club ${club.id}`);
      activeSubscriptionsRef.current[club.id] = true;
      
      const channel = supabase.channel(`club-messages-${club.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=eq.${club.id}`
        }, async (payload) => {
          try {
            const { data: sender } = await supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (!sender) {
              console.error('[useClubMessageSubscriptions] Error fetching sender');
              return;
            }
            
            const completeMessage = {
              ...payload.new,
              sender
            };
            
            setClubMessages(currentMessages => {
              const existingMessages = currentMessages[club.id] || [];
              
              if (existingMessages.some(msg => msg.id === payload.new.id)) {
                return currentMessages;
              }
              
              return {
                ...currentMessages,
                [club.id]: [...existingMessages, completeMessage]
              };
            });
          } catch (error) {
            console.error('[useClubMessageSubscriptions] Error processing message:', error);
          }
        });

      channel.subscribe((status) => {
        console.log(`[useClubMessageSubscriptions] Channel status for club ${club.id}:`, status);
      });

      return channel;
    }).filter(Boolean);
    
    cleanupRef.current = () => {
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      activeSubscriptionsRef.current = {};
    };

    return cleanupRef.current;
  }, [userClubs, isOpen, setClubMessages]);
};
