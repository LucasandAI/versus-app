
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('[useRealtimeMessages] Setting up real-time message subscription');
    
    const channel = supabase.channel('club-messages')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'club_chat_messages' },
          async (payload) => {
            console.log('[useRealtimeMessages] Message event received:', { 
              event: payload.eventType, 
              data: payload 
            });
            
            if (payload.eventType === 'DELETE' && payload.old) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              setLocalClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                return {
                  ...prev,
                  [clubId]: prev[clubId].filter(msg => String(msg.id) !== String(deletedMessageId))
                };
              });
            }
            
            if (payload.eventType === 'INSERT' && payload.new) {
              const newMessage = payload.new;
              const clubId = newMessage.club_id;
              
              // Fetch sender info if needed
              const { data: senderData } = await supabase
                .from('users')
                .select('id, name, avatar')
                .eq('id', newMessage.sender_id)
                .single();
                
              const messageWithSender = {
                ...newMessage,
                sender: senderData || {
                  id: newMessage.sender_id,
                  name: 'Unknown',
                  avatar: null
                }
              };
              
              setLocalClubMessages(prev => {
                const clubMessages = prev[clubId] || [];
                
                // Check if message already exists
                if (clubMessages.some(msg => String(msg.id) === String(newMessage.id))) {
                  return prev;
                }
                
                return {
                  ...prev,
                  [clubId]: [...clubMessages, messageWithSender]
                };
              });
            }
          })
      .subscribe();
      
    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
