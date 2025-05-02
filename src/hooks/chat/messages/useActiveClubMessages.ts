
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useUnreadMessages } from '@/context/unread-messages';
import { ChatMessage } from '@/types/chat';

export const useActiveClubMessages = (clubId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useApp();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const renderCountRef = useRef(0);
  const { markClubMessagesAsRead } = useUnreadMessages();
  
  // Debug tracking
  const [debugInfo, setDebugInfo] = useState({
    messageCount: 0,
    renderCount: 0,
    lastMessageId: ''
  });
  
  // Force update mechanism
  const forceUpdate = useCallback(() => {
    renderCountRef.current += 1;
    setDebugInfo(prev => ({
      ...prev,
      renderCount: renderCountRef.current,
      messageCount: messages.length
    }));
  }, [messages.length]);
  
  // Helper to add messages without duplicates
  const addMessagesWithoutDuplicates = useCallback((prevMessages: any[], newMessages: any[]) => {
    if (!newMessages?.length) return prevMessages;
    
    const uniqueMessages = newMessages.filter(newMsg => {
      // Skip messages we've already processed
      if (messageIdsRef.current.has(newMsg.id)) return false;
      
      // Add to our tracking set
      messageIdsRef.current.add(newMsg.id);
      return true;
    });
    
    if (uniqueMessages.length === 0) return prevMessages;
    
    const combinedMessages = [...prevMessages, ...uniqueMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    console.log(`[useActiveClubMessages] Added ${uniqueMessages.length} messages for club ${clubId}`);
    return combinedMessages;
  }, [clubId]);
  
  // Initial message fetching
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    messageIdsRef.current.clear();
    
    const fetchMessages = async () => {
      if (!clubId || !currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        console.log(`[useActiveClubMessages] Fetching messages for club ${clubId}`);
        
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
        
        if (data && !isCancelled) {
          // Track message IDs to prevent duplicates
          data.forEach(msg => messageIdsRef.current.add(msg.id));
          
          setMessages(data || []);
          setDebugInfo(prev => ({
            ...prev,
            messageCount: data?.length || 0,
            lastMessageId: data?.length ? data[data.length - 1].id : ''
          }));
          
          // Mark messages as read when loaded
          markClubMessagesAsRead(clubId);
        }
      } catch (error) {
        console.error('[useActiveClubMessages] Error fetching messages:', error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchMessages();
    
    return () => {
      isCancelled = true;
    };
  }, [clubId, currentUser, markClubMessagesAsRead]);
  
  // Set up realtime subscription
  useEffect(() => {
    if (!clubId || !currentUser?.id) return;
    
    console.log(`[useActiveClubMessages] Setting up subscription for club ${clubId}`);
    
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Create a new real-time channel for this club
    channelRef.current = supabase.channel(`club-messages-${clubId}-${Date.now()}`);
    
    // Subscribe to message inserts
    channelRef.current
      .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'club_chat_messages',
            filter: `club_id=eq.${clubId}`
          },
          async (payload) => {
            console.log(`[useActiveClubMessages] New message received for club ${clubId}:`, payload.new?.id);
            
            if (!isMountedRef.current || !payload.new) return;
            
            // Skip if we already have this message (prevents duplicates)
            if (messageIdsRef.current.has(payload.new.id)) {
              console.log(`[useActiveClubMessages] Skipping duplicate message ${payload.new.id}`);
              return;
            }
            
            try {
              // Fetch sender details if needed
              let messageWithSender = payload.new;
              
              if (payload.new.sender_id && !payload.new.sender) {
                const { data: senderData } = await supabase
                  .from('users')
                  .select('id, name, avatar')
                  .eq('id', payload.new.sender_id)
                  .single();
                  
                if (senderData) {
                  messageWithSender = {
                    ...payload.new,
                    sender: senderData
                  };
                }
              }
              
              // Add to tracking set
              messageIdsRef.current.add(messageWithSender.id);
              
              // Update messages with new reference to trigger re-render
              setMessages(prev => {
                const newMessages = [...prev, messageWithSender].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                
                // Update debug info
                setDebugInfo(current => ({
                  ...current,
                  messageCount: newMessages.length,
                  lastMessageId: messageWithSender.id
                }));
                
                return newMessages;
              });
              
              // If the message is from someone else and we're viewing this club, mark as read
              if (payload.new.sender_id !== currentUser.id) {
                markClubMessagesAsRead(clubId);
              } else {
                // For our own messages, just dispatch a notification for badge updates
                window.dispatchEvent(new CustomEvent('clubMessageSent', { 
                  detail: { clubId } 
                }));
              }
              
              // Force update to ensure render
              forceUpdate();
              
            } catch (error) {
              console.error('[useActiveClubMessages] Error processing message:', error);
            }
          })
      .on('postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'club_chat_messages',
            filter: `club_id=eq.${clubId}`
          },
          (payload) => {
            if (!payload.old?.id) return;
            
            console.log(`[useActiveClubMessages] Message deleted: ${payload.old.id}`);
            
            // Remove the message from our tracking set
            messageIdsRef.current.delete(payload.old.id);
            
            // Update messages with deletion
            setMessages(prev => {
              const filteredMessages = prev.filter(msg => msg.id !== payload.old.id);
              return filteredMessages;
            });
            
            // Force update to ensure render
            forceUpdate();
          })
      .subscribe((status) => {
        console.log(`[useActiveClubMessages] Subscription status for club ${clubId}:`, status);
      });
      
    // Mark messages as read when this hook is initialized for the active club
    markClubMessagesAsRead(clubId);
    
    return () => {
      // Clean up subscription on unmount
      console.log(`[useActiveClubMessages] Cleaning up subscription for club ${clubId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clubId, currentUser?.id, forceUpdate, markClubMessagesAsRead]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      messageIdsRef.current.clear();
    };
  }, []);
  
  // Add message function (for optimistic updates)
  const addMessage = useCallback((message: any) => {
    if (!message?.id || messageIdsRef.current.has(message.id)) return false;
    
    messageIdsRef.current.add(message.id);
    
    setMessages(prev => {
      const newMessages = [...prev, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setDebugInfo(current => ({
        ...current,
        messageCount: newMessages.length,
        lastMessageId: message.id
      }));
      
      return newMessages;
    });
    
    return true;
  }, []);
  
  // Delete message function
  const deleteMessage = useCallback((messageId: string) => {
    messageIdsRef.current.delete(messageId);
    
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== messageId);
      
      setDebugInfo(current => ({
        ...current,
        messageCount: filtered.length
      }));
      
      return filtered;
    });
  }, []);
  
  return {
    messages,
    setMessages,
    loading,
    isSending,
    setIsSending,
    addMessage,
    deleteMessage,
    debugInfo
  };
};

export default useActiveClubMessages;
