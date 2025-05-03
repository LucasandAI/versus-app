import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useUserData } from './useUserData';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from './useUnreadMessages';
import { useMessageOptimism } from './useMessageOptimism';

export const useMessageHandling = (clubId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { currentUser } = useApp();
  const { addOptimisticMessage, scrollToBottom } = useMessageOptimism();
  const { updateClubUnreadCount } = useUnreadMessages();
  const processedMsgIds = useRef(new Set<string>());

  // Handle new messages
  const handleNewMessage = useCallback((message: ChatMessage) => {
    const msgId = message.id?.toString();
    if (!msgId || processedMsgIds.current.has(msgId)) return;
    
    // Mark as processed
    processedMsgIds.current.add(msgId);
    
    // Update messages state
    setMessages(prev => {
      if (prev.some(msg => msg.id === msgId)) return prev;
      return [...prev, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    // Update unread count and notify UI
    updateClubUnreadCount(clubId, 1);
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('clubMessageReceived', {
      detail: {
        clubId,
        message,
        unreadCount: 1
      }
    }));
  }, [clubId, updateClubUnreadCount]);

  // Handle message deletion
  const handleMessageDeleted = useCallback((messageId: string) => {
    const msgId = messageId.toString();
    if (!msgId) return;
    
    // Remove from processed set
    processedMsgIds.current.delete(msgId);
    
    // Update messages state
    setMessages(prev => prev.filter(msg => msg.id !== msgId));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('clubMessageDeleted', {
      detail: {
        clubId,
        messageId: msgId
      }
    }));
  }, [clubId]);

  // Listen for club message events
  useEffect(() => {
    const handleClubMessageReceived = (e: CustomEvent) => {
      if (e.detail?.clubId !== clubId || !e.detail?.message) return;
      handleNewMessage(e.detail.message);
    };

    const handleClubMessageDeleted = (e: CustomEvent) => {
      if (e.detail?.clubId !== clubId || !e.detail?.messageId) return;
      handleMessageDeleted(e.detail.messageId);
    };

    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);
    };
  }, [clubId, handleNewMessage, handleMessageDeleted]);

  // Load initial messages
  const fetchMessages = useCallback(async () => {
    if (!clubId || !currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('club_messages')
        .select('*')
        .eq('club_id', clubId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages: ChatMessage[] = data.map(msg => {
          const msgId = msg.id?.toString();
          if (msgId) {
            processedMsgIds.current.add(msgId);
          }
          
          return {
            id: msg.id,
            text: msg.text,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name || 'Unknown',
              avatar: msg.sender_avatar
            },
            timestamp: msg.timestamp
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[useMessageHandling] Error fetching messages:', error);
    }
  }, [clubId, currentUser]);

  // Fetch messages when club changes
  useEffect(() => {
    processedMsgIds.current.clear();
    fetchMessages();
  }, [clubId, fetchMessages]);

  return {
    messages,
    setMessages,
    handleNewMessage,
    handleMessageDeleted,
    addOptimisticMessage,
    scrollToBottom
  };
};
