import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useUserData } from './useUserData';
import { useApp } from '@/context/AppContext';
import { useMessageOptimism } from '@/hooks/chat/useMessageOptimism';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';

/**
 * Hook for managing active DM messages that syncs with global message state
 * and handles real-time updates via events
 */
export const useActiveDMMessages = (
  userId: string,
  userName: string,
  conversationId: string,
  otherUserData: { id: string; name: string; avatar?: string } | null
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { currentUser } = useApp();
  const { addOptimisticMessage: addGlobalOptimisticMessage, scrollToBottom } = useMessageOptimism();
  const { markDirectMessagesAsRead } = useMessageReadStatus();
  const processedMsgIds = useRef(new Set<string>());
  const otherUserDataRef = useRef(otherUserData);
  const userCache = useRef<Record<string, { name: string; avatar?: string }>>({});
  const stableConversationId = useRef(conversationId);

  // Update the ref when otherUserData changes
  useEffect(() => {
    otherUserDataRef.current = otherUserData;
    if (otherUserData) {
      userCache.current[otherUserData.id] = {
        name: otherUserData.name,
        avatar: otherUserData.avatar
      };
    }
  }, [otherUserData]);

  // Listen for DM message events
  useEffect(() => {
    const handleDMMessageReceived = (e: CustomEvent) => {
      if (e.detail?.conversationId !== stableConversationId.current || !e.detail?.message) {
        return;
      }
      
      const newMessage = e.detail.message;
      const msgId = newMessage.id?.toString();
      if (!msgId) return;
      
      // Skip if we've already processed this message
      if (processedMsgIds.current.has(msgId)) {
        return;
      }
      
      // Mark as processed
      processedMsgIds.current.add(msgId);
      
      // Add message to state
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(msg => msg.id === msgId)) {
          return prev;
        }
        
        // Add new message and sort by timestamp
        return [...prev, newMessage].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    };

    const handleDMMessageDeleted = (e: CustomEvent) => {
      if (e.detail?.conversationId !== stableConversationId.current) {
        return;
      }
      
      const msgId = e.detail.messageId?.toString();
      if (!msgId) return;
      
      // Remove from processed set
      processedMsgIds.current.delete(msgId);
      
      // Remove from messages
      setMessages(prev => 
        prev.filter(msg => msg.id !== msgId)
      );
    };

    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    window.addEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
      window.removeEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);
    };
  }, []);

  // Load initial messages for the conversation
  const fetchMessages = useCallback(async () => {
    if (!userId || !currentUser?.id || !conversationId || conversationId === 'new') {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database records to ChatMessage format
        const formattedMessages: ChatMessage[] = data.map(msg => {
          const isCurrentUser = msg.sender_id === currentUser.id;
          
          // Use stable user data from cache or props
          const senderData = isCurrentUser 
            ? { name: 'You', avatar: currentUser.avatar }
            : userCache.current[msg.sender_id] || {
                name: otherUserDataRef.current?.name || 'User',
                avatar: otherUserDataRef.current?.avatar
              };

          const msgId = msg.id?.toString();
          if (msgId) {
            processedMsgIds.current.add(msgId);
          }
          
          return {
            id: msg.id,
            text: msg.text,
            sender: {
              id: msg.sender_id,
              name: senderData.name,
              avatar: senderData.avatar
            },
            timestamp: msg.timestamp
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[useActiveDMMessages] Error fetching messages:', error);
    }
  }, [userId, currentUser, conversationId]);
  
  // Fetch messages when conversation changes
  useEffect(() => {
    stableConversationId.current = conversationId;
    processedMsgIds.current.clear();
    fetchMessages();
  }, [conversationId, fetchMessages]);

  // Add a new message optimistically
  const addLocalOptimisticMessage = useCallback((message: ChatMessage) => {
    const msgId = message.id?.toString();
    if (!msgId) return;
    
    // Mark as processed
    processedMsgIds.current.add(msgId);
    
    // Add to messages state
    setMessages(prev => [...prev, {
      ...message,
      optimistic: true
    }]);
  }, []);

  return {
    messages,
    setMessages,
    addOptimisticMessage: addLocalOptimisticMessage
  };
};
