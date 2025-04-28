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
        };
      });

      // Initialize message IDs set and remove any matching optimistic messages
      const confirmedMessageIds = new Set<string>();
      formattedMessages.forEach(msg => {
        confirmedMessageIds.add(createMessageId(msg));
      });

      // Filter out any optimistic messages that match confirmed messages
      setMessages(prevMessages => {
        return prevMessages.filter(msg => {
          if (isOptimisticMessage(msg.id)) {
            return !confirmedMessageIds.has(createMessageId(msg));
          }
          return true;
        });
      });

      // Add new messages
      addMessagesWithoutDuplicates(formattedMessages);
      setMessageIds(confirmedMessageIds);
      setErrorToastShown(false);
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
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, currentUser?.id, userName, errorToastShown, addMessagesWithoutDuplicates, isSessionReady]);

  // Effect to handle fetching messages when conversation details change
  useEffect(() => {
    // Clear any existing timeout
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
  const addMessageWithoutDuplicates = useCallback((message: any) => {
    const messageId = createMessageId(message);
    if (!messageIds.has(messageId)) {
      console.log('[useDMMessages] Adding new message:', message.id, isOptimisticMessage(message.id) ? '(optimistic)' : '');
      setMessages(prev => [...prev, message]);
      setMessageIds(prev => new Set(prev).add(messageId));
      return true;
    }
    return false;
  }, [messageIds]);

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
    addMessage: addMessageWithoutDuplicates,
    addMessages: addMessagesWithoutDuplicates,
    loading,
    isSending,
    setIsSending,
    refreshMessages: fetchMessages,
    deleteMessage: handleDeleteMessage
  };
};
