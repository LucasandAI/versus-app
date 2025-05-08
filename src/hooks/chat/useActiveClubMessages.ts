import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing active club messages that syncs with global message state
 * and processes messages in batches for better performance
 */
export const useActiveClubMessages = (
  clubId: string,
  globalMessages: Record<string, any[]> = {}
) => {
  // Use the global messages as the source of truth
  const [messages, setMessages] = useState<any[]>(globalMessages[clubId] || []);
  
  // Track initial load to prevent unnecessary fetch
  const initialLoadCompletedRef = useRef<boolean>(false);
  
  // Track currently active club to prevent cross-chat interference
  const activeClubRef = useRef<string>(clubId);
  
  // Message queue for batch processing
  const messageQueueRef = useRef<any[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  
  // Processed message IDs to prevent duplicates
  const processedMsgIdsRef = useRef<Set<string>>(new Set());
  
  // Optimistic message IDs tracking
  const optimisticMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Process queued messages in batches
  const processQueue = useCallback(() => {
    if (isProcessingQueueRef.current || messageQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    
    requestAnimationFrame(() => {
      // Process all queued messages at once
      const messagesToProcess = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      setMessages(prev => {
        // Create a map of existing messages for efficient lookup
        const prevMessageMap = new Map(prev.map(msg => [msg.id?.toString(), msg]));
        let hasNewMessages = false;
        
        // Process each message
        messagesToProcess.forEach(msg => {
          const msgId = msg.id?.toString();
          if (!msgId) return;
          
          // Skip if we've already processed this message
          if (processedMsgIdsRef.current.has(msgId)) {
            return;
          }
          
          // Check if message already exists
          const existingMessage = prevMessageMap.get(msgId);
          if (existingMessage) {
            // If existing message has better metadata than new message, keep existing
            if (
              existingMessage.sender && 
              existingMessage.sender.name && 
              existingMessage.sender.name !== 'Unknown' &&
              (!msg.sender || !msg.sender.name)
            ) {
              return;
            }
          }
          
          // Check if this is a real message matching an optimistic one
          const isOptimisticReplacement = !msg.optimistic && Array.from(optimisticMessageIdsRef.current).some(optId => {
            // Compare text content and sender to identify matches
            const matchesOptimistic = prev.find(m => 
              m.id === optId && 
              m.message === msg.message && 
              m.sender_id === msg.sender_id
            );
            
            if (matchesOptimistic) {
              // Remove the optimistic marker and message
              optimisticMessageIdsRef.current.delete(optId);
              prevMessageMap.delete(optId);
              return true;
            }
            return false;
          });
          
          // Mark as processed
          processedMsgIdsRef.current.add(msgId);
          
          // Add to messages state if not a replacement
          if (!isOptimisticReplacement) {
            prevMessageMap.set(msgId, msg);
            hasNewMessages = true;
          }
        });
        
        if (!hasNewMessages) {
          return prev;
        }
        
        // Convert map back to array and sort by timestamp
        const updatedMessages = Array.from(prevMessageMap.values());
        return updatedMessages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
      
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingQueueRef.current = false;
        
        // Check if new messages arrived during processing
        if (messageQueueRef.current.length > 0) {
          processQueue();
        }
      }, 50);
    });
  }, []);
  
  // Add a message to the queue
  const queueMessage = useCallback((message: any) => {
    const msgId = message.id?.toString();
    if (!msgId || processedMsgIdsRef.current.has(msgId)) return;
    
    messageQueueRef.current.push(message);
    
    // Process queue if not already processing
    if (!isProcessingQueueRef.current) {
      processQueue();
    }
  }, [processQueue]);
  
  // Add an optimistic message
  const addOptimisticMessage = useCallback((message: any) => {
    const msgId = message.id?.toString();
    if (!msgId || processedMsgIdsRef.current.has(msgId)) return;
    
    // Mark as optimistic
    optimisticMessageIdsRef.current.add(msgId);
    processedMsgIdsRef.current.add(msgId);
    
    // Add directly to state for immediate UI update
    setMessages(prev => {
      const updatedMessages = [...prev, {
        ...message,
        optimistic: true
      }];
      
      return updatedMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    console.log(`[useActiveClubMessages] Added optimistic message for club ${activeClubRef.current}:`, msgId);
  }, []);
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[clubId]) {
      // Don't update if it's the same messages (by reference)
      if (messages !== globalMessages[clubId]) {
        // For major changes (like club switching), replace entire state
        if (activeClubRef.current !== clubId || Math.abs(globalMessages[clubId].length - messages.length) > 3) {
          setMessages(globalMessages[clubId]);
          console.log(`[useActiveClubMessages] Complete sync with global state for club ${clubId}, messages: ${globalMessages[clubId].length}`);
        } 
        // For incremental updates, queue them
        else {
          globalMessages[clubId].forEach(msg => {
            const msgId = msg.id?.toString();
            if (msgId && !processedMsgIdsRef.current.has(msgId)) {
              queueMessage(msg);
            }
          });
        }
      }
    }
    
    // Update active club reference and clear state when club changes
    if (activeClubRef.current !== clubId) {
      activeClubRef.current = clubId;
      initialLoadCompletedRef.current = false;
      processedMsgIdsRef.current.clear();
      optimisticMessageIdsRef.current.clear();
      messageQueueRef.current = [];
      console.log(`[useActiveClubMessages] Club changed to ${clubId}, resetting state`);
    }
  }, [clubId, globalMessages, messages, queueMessage]);

  // Listen for club message events with better isolation
  useEffect(() => {
    const handleClubMessageReceived = (e: CustomEvent) => {
      // Only process events for the active club
      if (e.detail.clubId === activeClubRef.current && e.detail.message) {
        queueMessage(e.detail.message);
      }
    };

    const handleClubMessageDeleted = (e: CustomEvent) => {
      // Only process events for the active club
      if (e.detail.clubId === activeClubRef.current) {
        const msgId = e.detail.messageId?.toString();
        if (!msgId) return;
        
        // Remove from processed set and optimistic IDs
        if (processedMsgIdsRef.current.has(msgId)) {
          processedMsgIdsRef.current.delete(msgId);
        }
        
        if (optimisticMessageIdsRef.current.has(msgId)) {
          optimisticMessageIdsRef.current.delete(msgId);
        }
        
        setMessages(prev => {
          const filtered = prev.filter(msg => {
            const currentMsgId = msg.id?.toString();
            return currentMsgId !== msgId;
          });
          console.log(`[useActiveClubMessages] Message deleted for club ${activeClubRef.current}, new count: ${filtered.length}`);
          return filtered;
        });
      }
    };

    // Add event listeners
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);
    };
  }, [queueMessage]);

  // Load initial messages for the club if not in global state
  useEffect(() => {
    // Only fetch if:
    // 1. We don't have messages for this club yet
    // 2. Initial load hasn't been completed
    if ((!globalMessages[clubId]?.length || globalMessages[clubId].length === 0) && 
        !initialLoadCompletedRef.current) {
      
      const fetchMessages = async () => {
        try {
          console.log(`[useActiveClubMessages] Fetching messages for club ${clubId}`);
          initialLoadCompletedRef.current = true;
          
          const { data } = await supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              sender_id, 
              club_id, 
              timestamp,
              sender:sender_id (
                id, 
                name, 
                avatar
              )
            `)
            .eq('club_id', clubId)
            .order('timestamp', { ascending: true })
            .limit(50);

          if (data) {
            console.log(`[useActiveClubMessages] Fetched ${data.length} messages for club ${clubId}`);
            // Only set messages if the club hasn't changed during fetch
            if (activeClubRef.current === clubId) {
              // Process and mark all fetched messages as processed
              data.forEach(msg => {
                const msgId = msg.id?.toString();
                if (msgId) {
                  processedMsgIdsRef.current.add(msgId);
                }
              });
              
              setMessages(data);
            }
          }
        } catch (error) {
          console.error('[useActiveClubMessages] Error fetching club messages:', error);
        }
      };

      fetchMessages();
    }
  }, [clubId, globalMessages]);

  return { 
    messages, 
    addOptimisticMessage,
    queueMessage
  };
};
