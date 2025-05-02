
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';

export const useActiveClubMessages = (clubId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  const messageUpdateCount = useRef(0);

  // Clean up resources when unmounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        console.log('[useActiveClubMessages] Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Fetch messages when clubId changes
  useEffect(() => {
    if (!isSessionReady || !clubId || !currentUser?.id) {
      setMessages([]);
      setLoading(false);
      initialFetchDone.current = false;
      return;
    }

    const fetchMessages = async () => {
      console.log(`[useActiveClubMessages] Fetching messages for club ${clubId}`);
      setLoading(true);
      try {
        const { data, error } = await supabase
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
          .limit(100);

        if (error) throw error;

        if (isMounted.current) {
          console.log(`[useActiveClubMessages] Fetched ${data?.length || 0} messages for club ${clubId}`);
          setMessages(data || []);
          setLoading(false);
          initialFetchDone.current = true;
          
          // Mark club messages as read when fetched
          markClubMessagesAsRead(clubId);
        }
      } catch (error) {
        console.error('[useActiveClubMessages] Error fetching messages:', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
  }, [clubId, currentUser?.id, isSessionReady, markClubMessagesAsRead]);

  // Add a safe message setter that guarantees a new array reference
  const safeSetMessages = useCallback((updater: React.SetStateAction<any[]>) => {
    messageUpdateCount.current += 1;
    const updateId = messageUpdateCount.current;
    
    setMessages(prevMessages => {
      const newMessages = typeof updater === 'function' 
        ? updater(prevMessages) 
        : updater;
      
      console.log(`[useActiveClubMessages] Updating messages (id: ${updateId}, club: ${clubId})`, {
        prevCount: prevMessages.length,
        newCount: newMessages.length,
        isNewReference: newMessages !== prevMessages
      });
      
      // Always ensure we return a new array reference to trigger re-renders
      return [...newMessages];
    });
  }, [clubId]);

  // Set up subscription for real-time updates
  useEffect(() => {
    if (!isSessionReady || !clubId || !currentUser?.id) {
      return;
    }

    // Clean up any existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[useActiveClubMessages] Setting up subscription for club ${clubId}`);
    
    // Create a new channel for this club
    const channel = supabase
      .channel(`club-messages:${clubId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, async (payload) => {
        if (!isMounted.current) return;
        
        console.log(`[useActiveClubMessages] New message received for club ${clubId}:`, payload.new?.id);
        
        // When a new message is received, fetch the sender details if not present
        let messageWithSender = payload.new;
        
        if (!messageWithSender.sender && messageWithSender.sender_id) {
          try {
            const { data: senderData } = await supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', messageWithSender.sender_id)
              .single();
              
            if (senderData) {
              messageWithSender = {
                ...messageWithSender,
                sender: senderData
              };
            }
          } catch (error) {
            console.error('[useActiveClubMessages] Error fetching sender details:', error);
          }
        }
        
        // Update the messages state using our safe setter to guarantee a new reference
        safeSetMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.some(msg => msg.id === messageWithSender.id)) {
            console.log('[useActiveClubMessages] Duplicate message, skipping', messageWithSender.id);
            return prev; // No change needed
          }
          
          console.log('[useActiveClubMessages] Adding new message to state:', messageWithSender.id);
          
          // Create a completely new array with the new message added and sorted
          return [...prev, messageWithSender].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        
        // If message is not from current user, dispatch event for notification
        if (messageWithSender.sender_id !== currentUser.id) {
          window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
            detail: { clubId: messageWithSender.club_id } 
          }));
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, (payload) => {
        if (!isMounted.current) return;
        
        console.log(`[useActiveClubMessages] Message deleted from club ${clubId}:`, payload.old?.id);
        
        // Remove the deleted message using our safe setter
        safeSetMessages(prev => prev.filter(msg => msg.id !== payload.old?.id));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log(`[useActiveClubMessages] Cleaning up subscription for club ${clubId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clubId, currentUser?.id, isSessionReady, safeSetMessages]);

  const addMessage = useCallback((message: any) => {
    // Check if the message already exists to avoid duplicates
    safeSetMessages(prev => {
      if (prev.some(msg => msg.id === message.id)) {
        return prev;
      }
      
      // Add the message to the array with a new array reference
      return [...prev, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }, [safeSetMessages]);

  const deleteMessage = useCallback((messageId: string) => {
    safeSetMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [safeSetMessages]);

  return {
    messages,
    setMessages: safeSetMessages,
    addMessage,
    loading,
    isSending,
    setIsSending,
    deleteMessage
  };
};
