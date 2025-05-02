
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';
import { ChatMessage } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useActiveClubMessages = (clubId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  const previousClubId = useRef<string | null>(null);
  const messageIdsRef = useRef(new Set<string>());

  // Helper function to check for duplicate messages
  const isDuplicate = useCallback((messageId: string) => {
    return messageIdsRef.current.has(messageId);
  }, []);

  // Add message ID to tracking set
  const trackMessageId = useCallback((messageId: string) => {
    messageIdsRef.current.add(messageId);
  }, []);

  // Remove all tracked message IDs
  const clearTrackedMessageIds = useCallback(() => {
    messageIdsRef.current.clear();
  }, []);

  // Clean up resources when unmounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        console.log('[useActiveClubMessages] Cleaning up subscription on unmount');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // When clubId changes, reset state
  useEffect(() => {
    if (previousClubId.current !== clubId) {
      console.log(`[useActiveClubMessages] Club ID changed from ${previousClubId.current} to ${clubId}`);
      setMessages([]);
      clearTrackedMessageIds();
      initialFetchDone.current = false;
      previousClubId.current = clubId;
    }
  }, [clubId, clearTrackedMessageIds]);

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
          // Clear previous message IDs when loading a new club
          clearTrackedMessageIds();
          
          // Track all fetched message IDs
          data?.forEach(msg => {
            if (msg.id) trackMessageId(msg.id);
          });
          
          // Set messages with a new array reference
          setMessages(data ? [...data] : []);
          setLoading(false);
          initialFetchDone.current = true;
          
          // Mark club messages as read when fetched
          markClubMessagesAsRead(clubId);
          
          console.log(`[useActiveClubMessages] Fetched ${data?.length || 0} messages for club ${clubId}`);
        }
      } catch (error) {
        console.error('[useActiveClubMessages] Error fetching messages:', error);
        if (isMounted.current) {
          setLoading(false);
          
          toast({
            title: "Error loading messages",
            description: "Couldn't load chat messages. Please try again.",
            variant: "destructive"
          });
        }
      }
    };

    fetchMessages();
  }, [clubId, currentUser?.id, isSessionReady, markClubMessagesAsRead, clearTrackedMessageIds, trackMessageId]);

  // Set up subscription for real-time updates
  useEffect(() => {
    if (!isSessionReady || !clubId || !currentUser?.id || !initialFetchDone.current) {
      return;
    }

    // Clean up any existing subscription
    if (channelRef.current) {
      console.log(`[useActiveClubMessages] Removing existing channel for ${clubId}`);
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
        
        const newMessageId = payload.new?.id;
        console.log(`[useActiveClubMessages] New message for club ${clubId}:`, newMessageId);
        
        // Check for duplicate message
        if (isDuplicate(newMessageId)) {
          console.log(`[useActiveClubMessages] Skipping duplicate message: ${newMessageId}`);
          return;
        }
        
        // Track this message ID
        trackMessageId(newMessageId);
        
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
        
        // Update the messages state with a new array reference to trigger re-render
        setMessages(prev => {
          const newMessages = [...prev, messageWithSender].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          console.log(`[useActiveClubMessages] Updated messages count: ${newMessages.length}`);
          return newMessages;
        });
        
        // If message is not from current user, dispatch event for notification
        if (messageWithSender.sender_id !== currentUser.id) {
          console.log(`[useActiveClubMessages] Dispatching clubMessageReceived event for club ${clubId}`);
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
        
        const deletedMessageId = payload.old?.id;
        console.log(`[useActiveClubMessages] Message deleted from club ${clubId}:`, deletedMessageId);
        
        // Remove the deleted message
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== deletedMessageId);
          console.log(`[useActiveClubMessages] Messages after deletion: ${filtered.length}`);
          return filtered;
        });
      })
      .subscribe(status => {
        console.log(`[useActiveClubMessages] Subscription status for club ${clubId}:`, status);
      });

    channelRef.current = channel;

    return () => {
      console.log(`[useActiveClubMessages] Cleaning up subscription for club ${clubId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clubId, currentUser?.id, isSessionReady, isDuplicate, trackMessageId]);

  const addMessage = useCallback((message: any) => {
    // Check if the message already exists
    if (isDuplicate(message.id)) {
      console.log(`[useActiveClubMessages] Skipping duplicate manual add: ${message.id}`);
      return false;
    }
    
    // Track this message ID
    trackMessageId(message.id);
    
    // Add the message to the array with a new reference
    setMessages(prev => {
      const newMessages = [...prev, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return newMessages;
    });
    
    return true;
  }, [isDuplicate, trackMessageId]);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    loading,
    isSending,
    setIsSending,
    deleteMessage
  };
};
