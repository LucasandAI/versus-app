
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';

export const useActiveClubMessages = (clubId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMounted = useRef(true);
  const { markClubMessagesAsRead, markClubAsUnread } = useUnreadMessages();
  
  // Clean up on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Fetch initial messages
  useEffect(() => {
    if (!isSessionReady || !clubId || !currentUser?.id) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
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
          .limit(50);
          
        if (error) throw error;
        
        if (data && isMounted.current) {
          // Always set a new array to ensure reference changes
          setMessages([...data]);
          
          // Mark messages as read when loaded
          markClubMessagesAsRead(clubId);
        }
      } catch (error) {
        console.error('[useActiveClubMessages] Error fetching messages:', error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    
    fetchMessages();
  }, [clubId, currentUser?.id, isSessionReady, markClubMessagesAsRead]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isSessionReady || !clubId || !currentUser?.id) {
      return;
    }
    
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    console.log(`[useActiveClubMessages] Setting up real-time listener for club ${clubId}`);
    
    const channel = supabase
      .channel(`club_messages:${clubId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, async (payload) => {
        if (!isMounted.current) return;
        
        console.log('[useActiveClubMessages] Received new message:', payload.new);
        
        const newMessage = payload.new;
        
        // If sender info is missing, fetch it
        let messageWithSender = newMessage;
        if (!newMessage.sender && newMessage.sender_id) {
          try {
            const { data: sender } = await supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', newMessage.sender_id)
              .single();
              
            if (sender) {
              messageWithSender = {
                ...newMessage,
                sender
              };
            }
          } catch (error) {
            console.error('[useActiveClubMessages] Error fetching sender:', error);
          }
        }
        
        if (isMounted.current) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => msg.id === messageWithSender.id);
            if (exists) return prev;
            
            // Look for optimistic message to replace
            const optimisticIndex = prev.findIndex(msg => 
              msg.optimistic && 
              msg.message === messageWithSender.message && 
              msg.sender_id === messageWithSender.sender_id
            );
            
            if (optimisticIndex !== -1) {
              const newMessages = [...prev];
              newMessages[optimisticIndex] = messageWithSender;
              return newMessages;
            }
            
            // Add as new message with new array reference
            const updatedMessages = [...prev, messageWithSender];
            
            // Dispatch event to notify other components
            if (messageWithSender.sender_id !== currentUser.id) {
              // Only mark messages as unread if they're from other users
              markClubAsUnread(clubId);
            }
            
            // Dispatch custom event with clubId for components to react
            window.dispatchEvent(new CustomEvent('clubMessageInserted', {
              detail: { 
                clubId,
                messageId: messageWithSender.id,
                senderId: messageWithSender.sender_id 
              }
            }));
            
            return updatedMessages;
          });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, (payload) => {
        if (!isMounted.current) return;
        
        console.log('[useActiveClubMessages] Message deleted:', payload.old);
        
        const deletedMessage = payload.old;
        if (deletedMessage && deletedMessage.id) {
          setMessages(prev => 
            prev.filter(msg => msg.id !== deletedMessage.id)
          );
          
          // Dispatch event for deleted messages too
          window.dispatchEvent(new CustomEvent('clubMessageDeleted', {
            detail: { 
              clubId,
              messageId: deletedMessage.id 
            }
          }));
        }
      })
      .subscribe();
      
    channelRef.current = channel;
    
    return () => {
      console.log('[useActiveClubMessages] Cleaning up Supabase channel');
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [clubId, currentUser?.id, isSessionReady, markClubAsUnread]);

  // Helper for adding optimistic messages
  const addMessage = (message: any): void => {
    if (!message) return;
    
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      // Add message with a fresh array
      const updatedMessages = [...prev, message];
      
      // Don't dispatch event for optimistic messages (we'll dispatch when the real one arrives)
      if (!message.optimistic) {
        window.dispatchEvent(new CustomEvent('clubMessageInserted', {
          detail: { 
            clubId,
            messageId: message.id,
            senderId: message.sender_id 
          }
        }));
      }
      
      return updatedMessages;
    });
  };

  // Helper for deleting messages
  const deleteMessage = (messageId: string): void => {
    if (!messageId) return;
    
    // Optimistic update
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Dispatch delete event
    window.dispatchEvent(new CustomEvent('clubMessageDeleted', {
      detail: { 
        clubId,
        messageId 
      }
    }));
  };

  return {
    messages,
    loading,
    isSending,
    setIsSending,
    addMessage,
    deleteMessage,
    setMessages
  };
};
