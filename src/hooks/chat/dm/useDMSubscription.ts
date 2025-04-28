
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

export const useDMSubscription = (
  userId: string, 
  currentUserId: string | undefined, 
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  useEffect(() => {
    if (!userId || !currentUserId) return;

    // Subscribe to message deletions
    const deleteChannel = supabase
      .channel('dm-deletions')
      .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `or(and(sender_id=eq.${currentUserId},receiver_id=eq.${userId}),and(sender_id=eq.${userId},receiver_id=eq.${currentUserId}))`
          },
          (payload) => {
            if (payload.old) {
              setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
            }
          })
      .subscribe();

    // Subscribe to new messages
    const insertChannel = supabase
      .channel('dm-insertions')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `or(and(sender_id=eq.${currentUserId},receiver_id=eq.${userId}),and(sender_id=eq.${userId},receiver_id=eq.${currentUserId}))`
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

    return () => {
      supabase.removeChannel(deleteChannel);
      supabase.removeChannel(insertChannel);
    };
  }, [userId, currentUserId, setMessages]);
};
