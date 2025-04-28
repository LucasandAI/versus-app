
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import debounce from 'lodash/debounce';

// Helper function to identify optimistic messages
const isOptimisticMessage = (messageId: string) => messageId.startsWith('temp-');

// Helper function to create a unique message ID for deduplication
const createMessageId = (message: any): string => {
  return `${message.text}-${message.sender?.id || 'unknown'}-${message.timestamp || Date.now()}`;
};

// Helper to find a matching optimistic message within a time window
const findMatchingOptimisticMessage = (
  messages: any[], 
  confirmedMessage: any, 
  timeWindowMs: number = 5000
): { index: number; message: any } | null => {
  if (!messages.length) return null;
  
  const confirmTimestamp = new Date(confirmedMessage.timestamp).getTime();
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    
    // Only check optimistic messages
    if (!message.optimistic) continue;
    
    // Match on text and sender
    if (message.text === confirmedMessage.text && 
        message.sender.id === confirmedMessage.sender.id) {
      
      // Check if within time window
      const msgTimestamp = new Date(message.timestamp).getTime();
      const timeDiff = Math.abs(confirmTimestamp - msgTimestamp);
      
      if (timeDiff <= timeWindowMs) {
        return { index: i, message };
      }
    }
  }
  
  return null;
};

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const { unhideConversation } = useHiddenDMs();
  const [errorToastShown, setErrorToastShown] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const conversationIdRef = useRef(conversationId);

  // Update ref when conversation ID changes
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Function to add messages without duplicates
  const addMessagesWithoutDuplicates = useCallback((newMessages: any[]) => {
    setMessages(prevMessages => {
      const updatedMessages: any[] = [...prevMessages];
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
        setMessageIds(updatedMessageIds);
        return updatedMessages;
      }
      return prevMessages;
    });
  }, [messageIds]);

  // Clean up timeout on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Message fetching function without artificial delay
  const fetchMessages = useCallback(async () => {
    // Guard clause: early return if any required ID is missing or session not ready
    if (!userId || !currentUser?.id || !conversationIdRef.current || !isSessionReady) {
      if (conversationIdRef.current !== 'new') {
        setLoading(false);
      }
      return;
    }
    
    // Don't attempt to fetch messages for 'new' conversations
    if (conversationIdRef.current === 'new') {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      console.log(`Fetching messages for conversation ${conversationIdRef.current}`);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          text,
          sender_id,
          timestamp
        `)
        .eq('conversation_id', conversationIdRef.current)
        .order('timestamp', { ascending: true });

      if (!isMounted.current) return;
      
      if (error) throw error;
      
      // Separately fetch user info for message senders
      const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
      
      let userMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
        
        if (!isMounted.current) return;
        
        if (usersError) throw usersError;
        
        userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      if (!isMounted.current) return;
      
      const formattedMessages = (data || []).map((msg) => {
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
          optimistic: false
        };
      });

      // Initialize message IDs set and remove any matching optimistic messages
      const confirmedMessageIds = new Set<string>();
      formattedMessages.forEach(msg => {
        confirmedMessageIds.add(createMessageId(msg));
      });

      // Replace any optimistic messages with confirmed ones
      setMessages(prevMessages => {
        // First, filter out optimistic messages that match confirmed ones
        const filteredMessages = prevMessages.filter(msg => {
          if (msg.optimistic) {
            return !confirmedMessageIds.has(createMessageId(msg));
          }
          return true;
        });
        // Then add the confirmed messages
        return [...filteredMessages, ...formattedMessages];
      });
      
      setMessageIds(confirmedMessageIds);
      setErrorToastShown(false);
      setLoading(false);
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error('Error fetching direct messages:', error);
      
      if (!errorToastShown) {
        toast({
          title: "Error",
          description: "Could not load messages",
          variant: "destructive"
        });
        setErrorToastShown(true);
      }
      setLoading(false);
    }
  }, [userId, currentUser?.id, userName, errorToastShown, addMessagesWithoutDuplicates, isSessionReady]);

  // Effect to handle fetching messages when conversation details change
  useEffect(() => {
    // Clean up any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Fetch immediately if session is ready
    if (isSessionReady && conversationId && conversationId !== 'new') {
      console.log('[useDMMessages] Session ready, fetching messages immediately');
      fetchMessages();
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [userId, currentUser?.id, conversationId, fetchMessages, isSessionReady]);

  // Add a message without duplicates
  const addMessageWithoutDuplicates = useCallback((message: any, isOptimistic: boolean = false) => {
    const messageToAdd = {
      ...message,
      optimistic: isOptimistic
    };
    
    const messageId = createMessageId(messageToAdd);
    if (!messageIds.has(messageId)) {
      console.log('[useDMMessages] Adding new message:', messageToAdd.id, isOptimistic ? '(optimistic)' : '');
      setMessages(prev => [...prev, messageToAdd]);
      setMessageIds(prev => new Set(prev).add(messageId));
      return true;
    }
    return false;
  }, [messageIds]);

  // Process a received server message
  const processServerMessage = useCallback((serverMessage: any) => {
    // Don't process if no current user or not mounted
    if (!currentUser?.id || !isMounted.current) return;
    
    // Format the message object
    const formattedMessage = {
      id: serverMessage.id,
      text: serverMessage.text,
      sender: {
        id: serverMessage.sender_id,
        name: serverMessage.sender_id === currentUser.id ? currentUser.name : 'User',
      },
      timestamp: serverMessage.timestamp,
      optimistic: false
    };
    
    // Check if we have a matching optimistic message
    setMessages(prevMessages => {
      // Try to find a matching optimistic message within ±5 seconds
      const match = findMatchingOptimisticMessage(prevMessages, formattedMessage);
      
      if (match) {
        console.log('[useDMMessages] Found matching optimistic message, replacing:', match.message.id);
        // Replace the optimistic message with the confirmed one
        const updatedMessages = [...prevMessages];
        updatedMessages[match.index] = formattedMessage;
        return updatedMessages;
      } else {
        // No matching optimistic message found, add as new
        console.log('[useDMMessages] No matching optimistic message, adding as new');
        if (!messageIds.has(createMessageId(formattedMessage))) {
          return [...prevMessages, formattedMessage];
        }
        return prevMessages;
      }
    });
  }, [currentUser?.id, messageIds]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    // First remove the message optimistically
    setMessages(prev => prev.filter(msg => msg.id !== messageId));

    // If it's an optimistic message that hasn't been saved yet, we're done
    if (isOptimisticMessage(messageId)) {
      console.log('[useDMMessages] Deleted optimistic message:', messageId);
      return;
    }

    // Otherwise, attempt to delete from database
    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete message",
        variant: "destructive"
      });
    }
  }, []);

  // Pre-fetch messages when conversation changes
  useEffect(() => {
    if (isSessionReady && conversationId && conversationId !== 'new') {
      console.log('[useDMMessages] Pre-fetching messages for conversation:', conversationId);
      fetchMessages();
    }
  }, [isSessionReady, conversationId, fetchMessages]);

  return {
    messages,
    setMessages,
    addMessage: (message: any) => addMessageWithoutDuplicates(message, false),
    addOptimisticMessage: (message: any) => addMessageWithoutDuplicates(message, true),
    addMessages: addMessagesWithoutDuplicates,
    processServerMessage,
    loading,
    isSending,
    setIsSending,
    refreshMessages: fetchMessages,
    deleteMessage: handleDeleteMessage
  };
};
