
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';
import { useUnreadMessages } from '@/context/unread-messages';

export const useDirectMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { currentUser } = useApp();
  const { markConversationAsRead, refreshUnreadCounts } = useUnreadMessages();
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id || conversationId === 'new') return;
    
    // Skip if this is the same conversation we already fetched
    if (previousConversationIdRef.current === conversationId) return;
    previousConversationIdRef.current = conversationId;

    const fetchMessages = async () => {
      try {
        console.log('[useDirectMessages] Fetching messages for conversation:', conversationId);
        
        // First fetch messages
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
            timestamp
          `)
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        if (data) {
          // Get unique sender IDs
          const senderIds = [...new Set(data.map(msg => msg.sender_id))];
          let userMap: Record<string, any> = {};
          
          // Fetch user data for all senders
          if (senderIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, name, avatar')
              .in('id', senderIds);
              
            if (usersError) {
              console.error('[useDirectMessages] Error fetching user data:', usersError);
            } else {
              userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
                acc[user.id] = user;
                return acc;
              }, {});
            }
          }

          // Normalize messages with user data
          const normalizedMessages = data.map(message => {
            const senderInfo = userMap[message.sender_id] || {
              id: message.sender_id,
              name: 'Unknown User',
              avatar: null
            };
            
            // Track last message ID to prevent duplicates
            if (message.id) {
              lastMessageIdRef.current = message.id;
            }

            return {
              id: message.id,
              text: message.text,
              timestamp: message.timestamp,
              sender: {
                id: senderInfo.id,
                name: senderInfo.name,
                avatar: senderInfo.avatar
              },
              isUserMessage: String(message.sender_id) === String(currentUser.id)
            };
          });
          
          console.log('[useDirectMessages] Normalized messages:', normalizedMessages.length);
          setMessages(normalizedMessages);

          // Mark as read immediately after loading
          markConversationAsRead(conversationId);
          
          // Trigger refresh of unread counts
          setTimeout(() => refreshUnreadCounts(), 200);
          
          // Dispatch event that conversation was opened
          window.dispatchEvent(new CustomEvent('conversationOpened', {
            detail: {
              type: 'dm',
              id: conversationId
            }
          }));
        }
      } catch (error) {
        console.error('[useDirectMessages] Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [conversationId, currentUser?.id, markConversationAsRead, refreshUnreadCounts]);

  // Set up real-time subscription when conversation is active
  useEffect(() => {
    if (!conversationId || !currentUser?.id || conversationId === 'new') return;
    
    // Skip if subscription is already active for this conversation
    if (subscriptionActive && channelRef.current) return;

    console.log(`[useDirectMessages] Setting up real-time subscription for conversation: ${conversationId}`);

    // Clean up any existing subscription first
    if (channelRef.current) {
      console.log('[useDirectMessages] Cleaning up existing subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setSubscriptionActive(false);
    }

    // Dispatch active conversation change event
    window.dispatchEvent(new CustomEvent('activeConversationChanged', { 
      detail: { 
        type: 'dm', 
        id: conversationId 
      } 
    }));

    // Mark as read immediately when conversation becomes active
    markConversationAsRead(conversationId);
    
    // Immediate refresh of unread counts
    window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));

    // Set up subscription for real-time updates
    const channel = supabase
      .channel(`direct_messages:${conversationId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Skip if we already have this message
          if (lastMessageIdRef.current === newMessage.id) {
            console.log('[useDirectMessages] Skipping duplicate message:', newMessage.id);
            return;
          }
          
          // Update last message ID
          lastMessageIdRef.current = newMessage.id;
          
          // Fetch sender data for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', newMessage.sender_id)
            .single();
            
          const normalizedMessage = {
            id: newMessage.id,
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            sender: userData || {
              id: newMessage.sender_id,
              name: 'Unknown User',
              avatar: null
            },
            isUserMessage: String(newMessage.sender_id) === String(currentUser.id)
          };
          
          console.log('[useDirectMessages] New real-time message received:', normalizedMessage.id);
          
          setMessages(prev => {
            // Double check we don't have this message
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            
            // Add new message to the list and sort by timestamp
            const updatedMessages = [...prev, normalizedMessage].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            return updatedMessages;
          });
          
          // If message is from someone else, mark it as read since we're in the conversation
          if (newMessage.sender_id !== currentUser.id) {
            markConversationAsRead(conversationId);
            
            // Trigger refresh of unread counts to update badges
            setTimeout(() => refreshUnreadCounts(), 100);
          }
          
          // Dispatch event for other components to update
          window.dispatchEvent(new CustomEvent('dmMessageReceived', {
            detail: {
              conversationId: conversationId,
              message: normalizedMessage,
              senderId: newMessage.sender_id,
              isActiveConversation: true
            }
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('[useDirectMessages] Message deleted:', payload.old.id);
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log(`[useDirectMessages] Subscription status for ${conversationId}: ${status}`);
        if (status === 'SUBSCRIBED') {
          setSubscriptionActive(true);
          channelRef.current = channel;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSubscriptionActive(false);
          
          // Try to resubscribe after a delay
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
              setSubscriptionActive(false);
            }
          }, 5000);
        }
      });

    // Store the channel reference
    channelRef.current = channel;
    
    // Cleanup function
    return () => {
      console.log(`[useDirectMessages] Cleaning up subscription for conversation: ${conversationId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setSubscriptionActive(false);
      }
      
      // Clear active conversation
      window.dispatchEvent(new CustomEvent('activeConversationChanged', {
        detail: { type: null, id: null }
      }));
    };
  }, [conversationId, currentUser?.id, markConversationAsRead, refreshUnreadCounts]);

  return { messages, setMessages };
};
