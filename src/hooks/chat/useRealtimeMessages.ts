
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('[useRealtimeMessages] Setting up real-time message subscriptions');
    
    // Single channel for all message events
    const channel = supabase.channel('club-messages-channel')
      // Handle message insertions
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('[useRealtimeMessages] Message insert event received:', payload);
            
            if (payload.new && payload.new.club_id) {
              const clubId = payload.new.club_id;
              
              // Update messages for the specific club
              setLocalClubMessages(prev => {
                const clubMessages = [...(prev[clubId] || [])];
                
                // Check if message already exists in the array
                const messageExists = clubMessages.some(msg => 
                  String(msg.id) === String(payload.new.id)
                );
                
                if (!messageExists) {
                  // Fetch sender information to include with the message
                  const fetchSenderInfo = async () => {
                    try {
                      const { data, error } = await supabase
                        .from('users')
                        .select('id, name, avatar')
                        .eq('id', payload.new.sender_id)
                        .single();
                        
                      if (!error && data) {
                        const enrichedMessage = {
                          ...payload.new,
                          sender: data
                        };
                        
                        setLocalClubMessages(current => ({
                          ...current,
                          [clubId]: [...(current[clubId] || []), enrichedMessage]
                        }));
                      } else {
                        // Fall back to just adding the message without sender info
                        setLocalClubMessages(current => ({
                          ...current,
                          [clubId]: [...(current[clubId] || []), payload.new]
                        }));
                      }
                    } catch (error) {
                      console.error('[useRealtimeMessages] Error fetching sender info:', error);
                      
                      // Still add the message even if we can't get sender info
                      setLocalClubMessages(current => ({
                        ...current,
                        [clubId]: [...(current[clubId] || []), payload.new]
                      }));
                    }
                  };
                  
                  fetchSenderInfo();
                }
                
                return prev;
              });
            }
          })
      // Handle message deletions
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('[useRealtimeMessages] Message deletion event received:', payload);
            
            if (payload.old && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              setLocalClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            }
          })
      .subscribe((status) => {
        console.log('[useRealtimeMessages] Subscription status:', status);
      });
      
    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscriptions');
      supabase.removeChannel(channel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
