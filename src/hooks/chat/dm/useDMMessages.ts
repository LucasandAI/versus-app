
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import debounce from 'lodash/debounce';

const FETCH_DELAY_MS = 300; // Increased delay before fetching

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

  // Debounced fetch function to avoid multiple rapid fetches
  const fetchMessages = useCallback(debounce(async () => {
    // Guard clause: early return if any required ID is missing
    if (!userId || !currentUser?.id || !conversationIdRef.current) {
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
      
      // Fetch messages using conversation ID
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
      
      // Only fetch user data if we have sender IDs
      let userMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
        
        if (!isMounted.current) return;
        
        if (usersError) throw usersError;
        
        // Create a map of user data by ID for quick lookup
        userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      if (!isMounted.current) return;
      
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

      if (!isMounted.current) return;
      
      setMessages(formattedMessages);
      setMessageIds(initialMessageIds);
      setErrorToastShown(false);
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error('Error fetching direct messages:', error);
      
      // Show toast only once per conversation
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
  }, 300), [userId, currentUser?.id, userName, errorToastShown]);

  // Effect to handle fetching messages when conversation details change
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a small delay before fetching
    fetchTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        fetchMessages();
      }
    }, FETCH_DELAY_MS);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchMessages.cancel(); // Cancel any pending debounced fetch
      }
    };
  }, [userId, currentUser?.id, conversationId, fetchMessages]);

  // Add a message without duplicates
  const addMessageWithoutDuplicates = useCallback((message: any) => {
    const messageId = createMessageId(message);
    if (!messageIds.has(messageId)) {
      setMessages(prev => [...prev, message]);
      setMessageIds(prev => new Set(prev).add(messageId));
      return true;
    }
    return false;
  }, [messageIds]);

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
    setIsSending,
    refreshMessages: fetchMessages
  };
};
