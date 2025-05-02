
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const processedMsgIds = useRef(new Set<string>()).current;
  const messageUpdateQueue = useRef<ChatMessage[]>([]);
  const isProcessingUpdates = useRef(false);
  const stableConversationId = useRef(conversationId);
  
  // Update the stable ref when conversationId changes
  useEffect(() => {
    stableConversationId.current = conversationId;
  }, [conversationId]);
  
  // Fetch other user's data if needed
  useEffect(() => {
    if (otherUserId && !userCache[otherUserId] && currentUserId) {
      fetchUserData(otherUserId);
    }
  }, [otherUserId, userCache, fetchUserData, currentUserId]);

  // Process message updates in batches to avoid multiple state updates
  const processMessageQueue = useCallback(() => {
    if (isProcessingUpdates.current || messageUpdateQueue.current.length === 0) return;
    
    isProcessingUpdates.current = true;
    
    // Process all queued messages at once
    const messagesToAdd = [...messageUpdateQueue.current];
    messageUpdateQueue.current = [];
    
    setMessages(prev => {
      const prevMessageMap = new Map(prev.map(msg => [msg.id, msg]));
      let hasNewMessages = false;
      
      // Process each message
      messagesToAdd.forEach(msg => {
        // Skip if we've already processed this message or it already exists
        if (processedMsgIds.has(msg.id) || prevMessageMap.has(msg.id)) {
          return;
        }
        
        // Mark as processed
        processedMsgIds.add(msg.id);
        prevMessageMap.set(msg.id, msg);
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
  }, [processedMsgIds]);

  // Listen for DM message events with optimized handler
  useEffect(() => {
    const handleDMMessageReceived = (e: CustomEvent) => {
      if (e.detail.conversationId === stableConversationId.current && e.detail.message) {
        const newMessage = e.detail.message;
        
        // Skip if we've already processed this message
        if (processedMsgIds.has(newMessage.id)) return;
        
        // Queue message update
        messageUpdateQueue.current.push(newMessage);
        
        // Schedule processing
        if (!isProcessingUpdates.current) {
          requestAnimationFrame(processMessageQueue);
        }
      }
    };

    const handleDMMessageDeleted = (e: CustomEvent) => {
      if (e.detail.conversationId === stableConversationId.current) {
        const msgId = e.detail.messageId;
        
        // Also remove from processed set
        if (processedMsgIds.has(msgId)) {
          processedMsgIds.delete(msgId);
        }
        
        setMessages(prev => 
          prev.filter(msg => msg.id !== msgId)
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
  }, [processMessageQueue, processedMsgIds, stableConversationId]);

  // Clear processed message IDs when conversation changes
  useEffect(() => {
    return () => {
      // Clear the processed message set when unmounting or when conversation changes
      processedMsgIds.clear();
      messageUpdateQueue.current = [];
    };
  }, [conversationId, processedMsgIds]);

  // Load initial messages for the conversation - use stable callback to prevent unnecessary refetches
  const fetchMessages = useCallback(async () => {
    // Skip for new conversations
    if (!conversationId || conversationId === 'new' || !currentUserId) {
      return;
    }

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
          
          // Add to processed set to prevent duplicates
          processedMsgIds.add(msg.id);
          
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
        
        // Use functional update to prevent race conditions
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[useActiveDMMessages] Error fetching DM messages:', error);
    }
  }, [conversationId, currentUserId, userCache, processedMsgIds]);
  
  // Only fetch messages when the conversation changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add a new message optimistically (for local UI updates)
  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    // Skip if already processed
    if (processedMsgIds.has(message.id)) return;
    
    // Add to processed set
    processedMsgIds.add(message.id);
    
    // Add to messages with functional update to prevent race conditions
    setMessages(prev => [...prev, {
      ...message,
      optimistic: true // Mark as optimistic
    }]);
  }, [processedMsgIds]);

  // Return stable object reference
  return useMemo(() => ({
    messages,
    setMessages,
    addOptimisticMessage
  }), [messages, addOptimisticMessage]);
};
