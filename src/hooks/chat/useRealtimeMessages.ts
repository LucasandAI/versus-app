
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('[useRealtimeMessages] Setting up real-time message subscriptions');
    
    // Channel for message deletions
    const messageDeleteChannel = supabase.channel('club-message-deletions');
    messageDeleteChannel
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('[useRealtimeMessages] Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              console.log(`[useRealtimeMessages] Removing message ${deletedMessageId} from club ${clubId}`);
              
              setLocalClubMessages(prev => {
                if (!prev[clubId]) {
                  console.log(`[useRealtimeMessages] No messages found for club ${clubId}`);
                  return prev;
                }
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                console.log(`[useRealtimeMessages] Updated messages count after deletion: ${updatedClubMessages.length} (was ${prev[clubId].length})`);
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            } else {
              console.warn('[useRealtimeMessages] Delete event missing required data:', payload);
            }
          })
      .subscribe((status) => {
        console.log(`[useRealtimeMessages] Subscription status for message deletions: ${status}`);
      });
    
    // Channel for message insertions
    const messageInsertChannel = supabase.channel('club-message-insertions');
    messageInsertChannel
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_chat_messages' },
          async (payload) => {
            console.log('[useRealtimeMessages] Message insert event received:', payload);
            
            if (payload.new && payload.new.id && payload.new.club_id) {
              const newMessageId = payload.new.id;
              const clubId = payload.new.club_id;
              
              // Fetch the complete message with sender details
              try {
                const { data: messageWithSender, error } = await supabase
                  .from('club_chat_messages')
                  .select(`
                    id, message, timestamp, sender_id, club_id,
                    sender:sender_id(id, name, avatar)
                  `)
                  .eq('id', newMessageId)
                  .single();
                  
                if (error) {
                  console.error('[useRealtimeMessages] Error fetching message with sender:', error);
                  return;
                }
                
                if (messageWithSender) {
                  console.log('[useRealtimeMessages] Adding new message to club:', messageWithSender);
                  
                  setLocalClubMessages(prev => {
                    const clubMessages = prev[clubId] || [];
                    
                    // Check if message already exists in the array
                    if (clubMessages.some(msg => String(msg.id) === String(newMessageId))) {
                      console.log(`[useRealtimeMessages] Message ${newMessageId} already exists in club ${clubId}`);
                      return prev;
                    }
                    
                    return {
                      ...prev,
                      [clubId]: [...clubMessages, messageWithSender]
                    };
                  });
                }
              } catch (fetchError) {
                console.error('[useRealtimeMessages] Error in real-time message fetch:', fetchError);
              }
            } else {
              console.warn('[useRealtimeMessages] Insert event missing required data:', payload);
            }
          })
      .subscribe((status) => {
        console.log(`[useRealtimeMessages] Subscription status for message insertions: ${status}`);
      });
      
    return () => {
      console.log('[useRealtimeMessages] Removing real-time message listeners');
      supabase.removeChannel(messageDeleteChannel);
      supabase.removeChannel(messageInsertChannel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
