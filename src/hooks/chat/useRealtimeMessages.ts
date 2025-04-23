
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
              
              console.log('[useRealtimeMessages] Handling delete for message:', deletedMessageId);
              setLocalClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedMessages = prev[clubId].filter(msg => String(msg.id) !== String(deletedMessageId));
                console.log(`[useRealtimeMessages] Updated club ${clubId} messages after deletion:`, 
                  { before: prev[clubId].length, after: updatedMessages.length });
                
                return {
                  ...prev,
                  [clubId]: updatedMessages
                };
              });
            }
            
            if (payload.eventType === 'INSERT' && payload.new) {
              const newMessage = payload.new;
              const clubId = newMessage.club_id;
              
              console.log('[useRealtimeMessages] Handling insert for club:', clubId);
              
              try {
                // Fetch sender info
                const { data: senderData, error } = await supabase
                  .from('users')
                  .select('id, name, avatar')
                  .eq('id', newMessage.sender_id)
                  .maybeSingle();
                  
                if (error) {
                  console.error('[useRealtimeMessages] Error fetching sender info:', error);
                }
                
                const messageWithSender = {
                  ...newMessage,
                  sender: senderData || {
                    id: newMessage.sender_id,
                    name: 'Unknown',
                    avatar: null
                  }
                };
                
                console.log('[useRealtimeMessages] Prepared new message with sender:', messageWithSender);
                
                setLocalClubMessages(prev => {
                  const clubMessages = prev[clubId] || [];
                  
                  // Check if message already exists
                  if (clubMessages.some(msg => String(msg.id) === String(newMessage.id))) {
                    console.log('[useRealtimeMessages] Message already exists, skipping');
                    return prev;
                  }
                  
                  console.log(`[useRealtimeMessages] Adding new message to club ${clubId}`);
                  return {
                    ...prev,
                    [clubId]: [...clubMessages, messageWithSender]
                  };
                });
              } catch (err) {
                console.error('[useRealtimeMessages] Error processing new message:', err);
              }
            }
          })
      .subscribe((status) => {
        console.log(`[useRealtimeMessages] Subscription status: ${status}`);
      });
      
    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
