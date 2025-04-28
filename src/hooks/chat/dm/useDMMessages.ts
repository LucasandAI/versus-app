
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

export const useDMMessages = (userId: string, userName: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !currentUser?.id) return;
      
      setLoading(true);
      try {
        // Fetch messages where either user is sender or receiver
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
            timestamp,
            users!sender_id (
              id,
              name,
              avatar
            )
          `)
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const formattedMessages = (data || []).map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: {
            id: msg.sender_id,
            name: msg.users?.name || (msg.sender_id === currentUser.id ? currentUser.name : userName),
            avatar: msg.users?.avatar || undefined
          },
          timestamp: msg.timestamp,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching direct messages:', error);
        toast({
          title: "Error",
          description: "Could not load messages",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, currentUser?.id, userName, currentUser?.name]);

  return {
    messages,
    setMessages,
    loading,
    isSending,
    setIsSending
  };
};
