import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook for managing active club messages that syncs with global message state
 */
export const useActiveClubMessages = (
  clubId: string,
  globalMessages: Record<string, any[]> = {}
) => {
  // Use the global messages as the source of truth
  const [messages, setMessages] = useState<any[]>(globalMessages[clubId] || []);
  
  // Queue for processing incoming messages to prevent UI flickering
  const messageQueueRef = useRef<any[]>([]);
  const processingQueueRef = useRef(false);
  const processedMessagesRef = useRef(new Set<string>());
  const initialLoadDoneRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  
  // Process message queue with debouncing using requestAnimationFrame
  const processMessageQueue = useCallback(() => {
    if (processingQueueRef.current || messageQueueRef.current.length === 0) return;
    
    processingQueueRef.current = true;
    
    // Clear any pending animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Process in the next animation frame to ensure smooth UI updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const batchToProcess = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        
        setMessages(prev => {
          const updatedMessages = [...prev];
          let hasChanges = false;
          
          batchToProcess.forEach(newMsg => {
            // Skip if we've already processed this message ID
            if (processedMessagesRef.current.has(newMsg.id)) return;
            
            // Check if message already exists in the array
            const existingIndex = updatedMessages.findIndex(msg => msg.id === newMsg.id);
            
            if (existingIndex >= 0) {
              // If it's an optimistic message being confirmed, update it
              if (updatedMessages[existingIndex].optimistic && !newMsg.optimistic) {
                updatedMessages[existingIndex] = newMsg;
                hasChanges = true;
              }
            } else {
              // Add new message
              updatedMessages.push(newMsg);
              processedMessagesRef.current.add(newMsg.id);
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            // Sort by timestamp for correct order
            return updatedMessages.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }
          
          return prev;
        });
        
        // Reset the updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
      }
      
      processingQueueRef.current = false;
      animationFrameRef.current = null;
      
      // Process any new messages that arrived during this batch
      if (messageQueueRef.current.length > 0) {
        processMessageQueue();
      }
    });
  }, []);

  // Add a message to the queue for processing
  const addMessageToQueue = useCallback((message: any) => {
    if (!message || !message.id) return;
    
    // If it's already in the queue, don't add it again
    if (messageQueueRef.current.some(msg => msg.id === message.id)) return;
    
    messageQueueRef.current.push(message);
    processMessageQueue();
  }, [processMessageQueue]);
  
  // Create an optimistic message
  const createOptimisticMessage = useCallback((text: string, userId: string, userName: string, userAvatar?: string) => {
    const optimisticId = `temp-${uuidv4()}`;
    const timestamp = new Date().toISOString();
    
    return {
      id: optimisticId,
      message: text,
      timestamp,
      club_id: clubId,
      sender_id: userId,
      sender: {
        id: userId,
        name: userName,
        avatar: userAvatar
      },
      optimistic: true
    };
  }, [clubId]);
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[clubId]?.length) {
      // Only replace our local state if this is the first load
      // or if our local state is empty (to prevent flickering)
      if (!initialLoadDoneRef.current || messages.length === 0) {
        // Make sure we update our processed messages set
        globalMessages[clubId].forEach(msg => {
          if (msg.id) processedMessagesRef.current.add(msg.id);
        });
        
        setMessages(globalMessages[clubId]);
        initialLoadDoneRef.current = true;
      }
    }
  }, [clubId, globalMessages, messages.length]);

  // Listen for club message events
  useEffect(() => {
    const handleClubMessageReceived = (e: CustomEvent) => {
      if (e.detail.clubId === clubId && e.detail.message) {
        addMessageToQueue(e.detail.message);
      }
    };

    const handleClubMessageDeleted = (e: CustomEvent) => {
      if (e.detail.clubId === clubId) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== e.detail.messageId)
        );
      }
    };

    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);
      
      // Clear any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clubId, addMessageToQueue]);

  // Load initial messages for the club if not in global state
  useEffect(() => {
    // Only fetch if we don't have messages for this club yet
    if (!globalMessages[clubId]?.length && !initialLoadDoneRef.current) {
      const fetchMessages = async () => {
        try {
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
            // Add fetched messages to our processed set to avoid duplicates
            data.forEach(msg => {
              if (msg.id) processedMessagesRef.current.add(msg.id);
            });
            
            setMessages(data);
            initialLoadDoneRef.current = true;
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
    addMessageToQueue,
    createOptimisticMessage
  };
};
