
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDMSubscription = (
  userId: string, 
  currentUserId: string | undefined, 
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  useEffect(() => {
    const channel = supabase
      .channel(`dm-conversation-${userId}-${currentUserId}`)
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'direct_messages' },
          (payload) => {
            if (payload.old) {
              setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
            }
          })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentUserId, setMessages]);
};
