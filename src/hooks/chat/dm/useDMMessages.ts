
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

// Helper function to create a unique message identifier for deduplication
const createMessageId = (message: any) => {
  return `${message.text}-${message.sender?.id}-${message.timestamp}`;
};

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();

  // Function to add messages without duplicates
  const addMessagesWithoutDuplicates = (newMessages: any[]) => {
    const updatedMessages: any[] = [...messages];
    const updatedMessageIds = new Set(messageIds);
    let hasNewMessages = false;

    newMessages.forEach(msg => {
      const messageId = createMessageId(msg);
      if (!updatedMessageIds.has(messageId)) {
        updatedMessages.push(msg);
        updatedMessageIds.add(messageId);
        hasNewMessages = true;
      }
    });

    if (hasNewMessages) {
      setMessages(updatedMessages);
      setMessageIds(updatedMessageIds);
    }
  };

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

        // Initialize message IDs set
        const initialMessageIds = new Set<string>();
        formattedMessages.forEach(msg => {
          initialMessageIds.add(createMessageId(msg));
        });

        setMessages(formattedMessages);
        setMessageIds(initialMessageIds);
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

  // Add a message without duplicates
  const addMessageWithoutDuplicates = (message: any) => {
    const messageId = createMessageId(message);
    if (!messageIds.has(messageId)) {
      setMessages(prev => [...prev, message]);
      setMessageIds(prev => new Set(prev).add(messageId));
      return true;
    }
    return false;
  };

  return {
    messages,
    setMessages: (messageUpdater: any) => {
      // If it's a function updater, we need to handle it specially
      if (typeof messageUpdater === 'function') {
        setMessages(prev => {
          const newMessages = messageUpdater(prev);
          
          // Update message IDs too
          const newIds = new Set<string>();
          newMessages.forEach((msg: any) => {
            newIds.add(createMessageId(msg));
          });
          setMessageIds(newIds);
          
          return newMessages;
        });
      } else {
        // Direct update
        setMessages(messageUpdater);
        
        // Update message IDs
        const newIds = new Set<string>();
        messageUpdater.forEach((msg: any) => {
          newIds.add(createMessageId(msg));
        });
        setMessageIds(newIds);
      }
    },
    addMessage: addMessageWithoutDuplicates,
    addMessages: addMessagesWithoutDuplicates,
    loading,
    isSending,
    setIsSending
  };
};
