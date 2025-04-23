
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('Setting up real-time message subscriptions');
    
    // Channel for message deletions
    const messageDeleteChannel = supabase.channel('club-message-deletions');
    messageDeleteChannel
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              console.log(`Removing message ${deletedMessageId} from club ${clubId}`);
              
              setLocalClubMessages(prev => {
                if (!prev[clubId]) {
                  console.log(`No messages found for club ${clubId}`);
                  return prev;
                }
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                console.log(`Updated messages count after deletion: ${updatedClubMessages.length} (was ${prev[clubId].length})`);
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            } else {
              console.warn('Delete event missing required data:', payload);
            }
          })
      .subscribe((status) => {
        console.log(`Subscription status for message deletions: ${status}`);
      });
    
    // Channel for message insertions
    const messageInsertChannel = supabase.channel('club-message-insertions');
    messageInsertChannel
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_chat_messages' },
          async (payload) => {
            console.log('Message insert event received:', payload);
            
            if (payload.new && payload.new.id && payload.new.club_id) {
              const newMessageId = payload.new.id;
              const clubId = payload.new.club_id;
              
              // Fetch the complete message with sender details
              const { data: messageWithSender, error } = await supabase
                .from('club_chat_messages')
                .select(`
                  *,
                  sender:sender_id(id, name, avatar)
                `)
                .eq('id', newMessageId)
                .single();
                
              if (error) {
                console.error('Error fetching message with sender:', error);
                return;
              }
              
              console.log(`Adding new message to club ${clubId}:`, messageWithSender);
              console.log('Sender ID for new message:', messageWithSender.sender_id);
              console.log('Sender data:', messageWithSender.sender);
              
              setLocalClubMessages(prev => {
                const clubMessages = prev[clubId] || [];
                
                // Check if message already exists in the array
                if (clubMessages.some(msg => String(msg.id) === String(newMessageId))) {
                  console.log(`Message ${newMessageId} already exists in club ${clubId}`);
                  return prev;
                }
                
                return {
                  ...prev,
                  [clubId]: [...clubMessages, messageWithSender]
                };
              });
            } else {
              console.warn('Insert event missing required data:', payload);
            }
          })
      .subscribe((status) => {
        console.log(`Subscription status for message insertions: ${status}`);
      });
      
    return () => {
      console.log('Removing real-time message listeners');
      supabase.removeChannel(messageDeleteChannel);
      supabase.removeChannel(messageInsertChannel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
