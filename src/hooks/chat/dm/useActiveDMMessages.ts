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
  const { addOptimisticMessage, scrollToBottom } = useMessageOptimism();
  const { markDirectMessagesAsRead } = useMessageReadStatus();
  const processedMsgIds = useRef(new Set<string>());
  const otherUserDataRef = useRef(otherUserData);
  const userCache = useRef<Record<string, { name: string; avatar?: string }>>({});
  const messageUpdateQueue = useRef<ChatMessage[]>([]);
  const isProcessingUpdates = useRef(false);
  const stableConversationId = useRef(conversationId);
  const optimisticMessageIds = useRef(new Set<string>());

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

  // Process message updates in batches
  const processMessageQueue = useCallback(() => {
    if (isProcessingUpdates.current || messageUpdateQueue.current.length === 0) return;
    
    isProcessingUpdates.current = true;
    
    // Process all queued messages at once
    const messagesToAdd = [...messageUpdateQueue.current];
    messageUpdateQueue.current = [];
    
    setMessages(prev => {
      // Create a map of existing messages for efficient lookup
      const prevMessageMap = new Map(prev.map(msg => [msg.id, msg]));
      let hasNewMessages = false;
      
      // Process each message
      messagesToAdd.forEach(msg => {
        const msgId = msg.id?.toString();
        if (!msgId) return;
        
        // Skip if we've already processed this message
        if (processedMsgIds.current.has(msgId)) {
          return;
        }

        // Check if message already exists in our state
        const existingMessage = prevMessageMap.get(msgId);
        if (existingMessage) {
          // If message exists and has complete sender info, KEEP the existing message
          if (existingMessage.sender?.name && existingMessage.sender.name !== 'Unknown') {
            return;
          }
          
          // If existing message has worse metadata than new message, allow replacement
          if (msg.sender?.name && msg.sender.name !== 'Unknown') {
            prevMessageMap.set(msgId, msg);
            hasNewMessages = true;
          }
          return;
        }
        
        // Mark as processed
        processedMsgIds.current.add(msgId);
        prevMessageMap.set(msgId, msg);
        hasNewMessages = true;
      });
      
      if (!hasNewMessages) {
        return prev;
      }
      
      // Convert map back to array and sort
      const updatedMessages = Array.from(prevMessageMap.values());
      return updatedMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingUpdates.current = false;
      
      // Check if new messages arrived during processing
      if (messageUpdateQueue.current.length > 0) {
        processMessageQueue();
      }
    }, 50);
  }, []);

  // Listen for DM message events with optimized handler
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
      
      // Queue message update
      messageUpdateQueue.current.push(newMessage);
      
      // Schedule processing
      if (!isProcessingUpdates.current) {
        requestAnimationFrame(processMessageQueue);
      }
    };

    const handleDMMessageDeleted = (e: CustomEvent) => {
      if (e.detail?.conversationId !== stableConversationId.current) {
        return;
      }
      
      const msgId = e.detail.messageId?.toString();
      if (!msgId) return;
      
      // Also remove from processed set
      if (processedMsgIds.current.has(msgId)) {
        processedMsgIds.current.delete(msgId);
      }
      
      // Remove from optimistic IDs if it exists
      if (optimisticMessageIds.current.has(msgId)) {
        optimisticMessageIds.current.delete(msgId);
      }
      
      setMessages(prev => 
        prev.filter(msg => msg.id !== msgId)
      );
    };

    // Add event listeners
    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    window.addEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
      window.removeEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);
    };
  }, [processMessageQueue]);

  // Load initial messages for the conversation
  const fetchMessages = useCallback(async () => {
    if (!userId || !currentUser?.id || !conversationId || conversationId === 'new') {
      return [];
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
      return [];
    }
  }, [userId, currentUser, conversationId]);
  
  // Only fetch messages when the conversation changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add a new message optimistically (for local UI updates)
  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    // Skip if already processed
    const msgId = message.id?.toString();
    if (!msgId || processedMsgIds.current.has(msgId)) return;
    
    // Track this as an optimistic message
    optimisticMessageIds.current.add(msgId);
    
    // Mark as processed
    processedMsgIds.current.add(msgId);
    
    // Add to messages state
    setMessages(prev => [...prev, {
      ...message,
      optimistic: true
    }]);
    
    console.log('[useActiveDMMessages] Added optimistic message:', msgId);
  }, []);

  // Return stable object reference
  return useMemo(() => ({
    messages,
    setMessages,
    addOptimisticMessage
  }), [messages, addOptimisticMessage]);
};
