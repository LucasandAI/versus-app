import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';

/**
 * Hook for managing active DM messages that relies exclusively on passed user data
 * and doesn't perform dynamic user data resolution
 */
export const useActiveDMMessages = (
  conversationId: string,
  otherUserId: string,
  currentUserId: string | undefined,
  otherUserData?: { id: string; name: string; avatar?: string }
) => {
  // Local state for messages in this conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Use stable refs to prevent capturing stale values in closures
  const processedMsgIds = useRef(new Set<string>());
  const messageUpdateQueue = useRef<ChatMessage[]>([]);
  const isProcessingUpdates = useRef(false);
  const stableConversationId = useRef(conversationId);
  const optimisticMessageIds = useRef(new Set<string>());
  
  // Store authoritative user data in refs for stable access
  const otherUserDataRef = useRef(otherUserData);
  const currentUserRef = useRef({
    id: currentUserId,
    name: 'You', 
    avatar: undefined
  });
  
  // Update the stable refs when props change
  useEffect(() => {
    stableConversationId.current = conversationId;
    otherUserDataRef.current = otherUserData;
    currentUserRef.current.id = currentUserId;
    
    // Clear tracked message state when conversation changes
    if (conversationId !== stableConversationId.current) {
      processedMsgIds.current.clear();
      optimisticMessageIds.current.clear();
      messageUpdateQueue.current = [];
    }
    
    console.log('[useActiveDMMessages] Updated stable refs with user data:', otherUserData);
  }, [conversationId, otherUserData, currentUserId]);

  // Process message updates in batches to avoid multiple state updates
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
          // Always keep the existing message if it has complete metadata
          // This prevents any flickering from metadata updates
          return;
        }
        
        // Check if this is a real message matching an optimistic one
        const isOptimisticReplacement = 
          !msg.optimistic && 
          Array.from(optimisticMessageIds.current).some(optId => {
            const matchesOptimistic = prev.find(m => 
              m.id === optId && 
              m.text === msg.text && 
              m.sender.id === msg.sender.id
            );
            
            if (matchesOptimistic) {
              optimisticMessageIds.current.delete(optId);
              prevMessageMap.delete(optId);
              return true;
            }
            return false;
          });
        
        if (!isOptimisticReplacement) {
          // Mark as processed
          processedMsgIds.current.add(msgId);
          prevMessageMap.set(msgId, msg);
          hasNewMessages = true;
        }
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
      // Only process messages for current conversation
      if (e.detail?.conversationId !== stableConversationId.current || !e.detail?.message) {
        return;
      }
      
      const newMessage = e.detail.message;
      const msgId = newMessage.id?.toString();
      if (!msgId) return;
      
      // Skip if we've already processed this message
      if (processedMsgIds.current.has(msgId)) {
        console.log('[useActiveDMMessages] Skipping already processed message:', msgId);
        return;
      }
      
      console.log('[useActiveDMMessages] Received new message event:', msgId);
      
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
    // Skip for new conversations
    if (!conversationId || conversationId === 'new' || !currentUserId || !otherUserData) {
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
        // Transform database records to ChatMessage format with authoritative sender data
        const formattedMessages: ChatMessage[] = data.map(msg => {
          const isCurrentUser = msg.sender_id === currentUserId;
          
          // Always use the pre-known user objects without any fallbacks
          const chatMessage = {
            id: msg.id,
            text: msg.text,
            sender: isCurrentUser ? 
              {
                id: currentUserId,
                name: 'You',
                avatar: undefined
              } : 
              {
                id: otherUserData.id,
                name: otherUserData.name,
                avatar: otherUserData.avatar
              },
            timestamp: msg.timestamp
          };
          
          const msgId = msg.id?.toString();
          if (msgId) {
            // Add to processed set to prevent duplicates
            processedMsgIds.current.add(msgId);
          }
          
          return chatMessage;
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[useActiveDMMessages] Error fetching DM messages:', error);
    }
  }, [conversationId, currentUserId, otherUserData]);
  
  // Only fetch messages when the conversation or user data changes
  useEffect(() => {
    if (otherUserData) {
      fetchMessages();
    }
  }, [fetchMessages, otherUserData]);

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
