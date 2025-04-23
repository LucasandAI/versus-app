
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('Setting up real-time message deletion listener');
    
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
      
    return () => {
      console.log('Removing real-time message deletion listener');
      supabase.removeChannel(messageDeleteChannel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
