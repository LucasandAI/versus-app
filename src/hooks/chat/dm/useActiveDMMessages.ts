
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useUserData } from './useUserData';

/**
 * Hook for managing active DM messages that syncs with global message state
 * and handles real-time updates via events
 */
export const useActiveDMMessages = (
  conversationId: string,
  otherUserId: string,
  currentUserId: string | undefined
) => {
  // Local state for messages in this conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { userCache, fetchUserData } = useUserData();
  
  // Fetch other user's data if needed
  useEffect(() => {
    if (otherUserId && !userCache[otherUserId]) {
      fetchUserData(otherUserId);
    }
  }, [otherUserId, userCache, fetchUserData]);

  // Listen for DM message events
  useEffect(() => {
    const handleDMMessageReceived = (e: CustomEvent) => {
      if (e.detail.conversationId === conversationId && e.detail.message) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === e.detail.message.id);
          if (exists) return prev;

          // Add the new message and sort by timestamp
          return [...prev, e.detail.message].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };

    const handleDMMessageDeleted = (e: CustomEvent) => {
      if (e.detail.conversationId === conversationId) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== e.detail.messageId)
        );
      }
    };

    // Add event listeners
    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    window.addEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
      window.removeEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);
    };
  }, [conversationId]);

  // Load initial messages for the conversation
  useEffect(() => {
    // Skip for new conversations
    if (!conversationId || conversationId === 'new' || !currentUserId) {
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from('direct_messages')
          .select(`
            id, 
            text, 
            sender_id, 
            receiver_id,
            conversation_id,
            timestamp
          `)
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true })
          .limit(50);

        if (data && data.length > 0) {
          // Transform database records to ChatMessage format
          const formattedMessages: ChatMessage[] = data.map(msg => {
            const isCurrentUser = msg.sender_id === currentUserId;
            const user = isCurrentUser ? null : userCache[msg.sender_id];
            
            return {
              id: msg.id,
              text: msg.text,
              sender: {
                id: msg.sender_id,
                name: isCurrentUser ? 'You' : user?.name || 'User',
                avatar: isCurrentUser ? undefined : user?.avatar || '/placeholder.svg'
              },
              timestamp: msg.timestamp
            };
          });
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('[useActiveDMMessages] Error fetching DM messages:', error);
      }
    };

    fetchMessages();
  }, [conversationId, currentUserId, userCache]);

  // Add a new message optimistically (for local UI updates)
  const addOptimisticMessage = (message: ChatMessage) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      return [...prev, {
        ...message,
        optimistic: true // Mark as optimistic
      }];
    });
  };

  return { 
    messages, 
    setMessages,
    addOptimisticMessage
  };
};
