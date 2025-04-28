
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDMSubscription = (
  conversationId: string,
  userId: string, 
  currentUserId: string | undefined, 
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  useEffect(() => {
    if (!currentUserId || !conversationId) return;
    
    let subscriptions: any[] = [];
    
    // Subscribe to message deletions by conversation ID
    const deleteChannel = supabase
      .channel('dm-deletions-by-conversation')
      .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            if (payload.old) {
              setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
            }
          })
      .subscribe();
    subscriptions.push(deleteChannel);

    // Subscribe to new messages by conversation ID
    const insertChannel = supabase
      .channel('dm-insertions-by-conversation')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            if (payload.new) {
              const { data: userData } = await supabase
                .from('users')
                .select('name, avatar')
                .eq('id', payload.new.sender_id)
                .single();

              const newMessage = {
                id: payload.new.id,
                text: payload.new.text,
                sender: {
                  id: payload.new.sender_id,
                  name: userData?.name || 'Unknown',
                  avatar: userData?.avatar
                },
                timestamp: payload.new.timestamp
              };

              setMessages(prev => [...prev, newMessage]);
            }
          })
      .subscribe();
    subscriptions.push(insertChannel);

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [conversationId, userId, currentUserId, setMessages]);
};
