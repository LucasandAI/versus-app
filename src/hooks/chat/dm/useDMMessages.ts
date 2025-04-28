
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !currentUser?.id || !conversationId) return;
      
      setLoading(true);
      try {
        // Fetch messages using conversation ID
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
            timestamp
          `)
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        
        // Separately fetch user info for message senders
        const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
        
        if (usersError) throw usersError;

        // Create a map of user data by ID for quick lookup
        const userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
          acc[user.id] = user;
          return acc;
        }, {});

        const formattedMessages = (data || []).map((msg) => {
          // Look up user info from our map
          const senderInfo = userMap[msg.sender_id] || {
            id: msg.sender_id,
            name: msg.sender_id === currentUser.id ? currentUser.name : userName,
            avatar: undefined
          };

          return {
            id: msg.id,
            text: msg.text,
            sender: {
              id: senderInfo.id,
              name: senderInfo.name,
              avatar: senderInfo.avatar
            },
            timestamp: msg.timestamp,
          };
        });

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
  }, [userId, currentUser?.id, userName, currentUser?.name, conversationId]);

  return {
    messages,
    setMessages,
    loading,
    isSending,
    setIsSending
  };
};
