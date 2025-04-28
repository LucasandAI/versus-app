import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDMSubscription = (
  conversationId: string,
  userId: string, 
  currentUserId: string | undefined, 
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  addMessage?: (message: any) => boolean
) => {
  const subscriptionError = useRef(false);
  
  useEffect(() => {
    if (!currentUserId) return;
    
    // Don't set up subscription for 'new' conversations without an ID yet
    if (conversationId === 'new') return;
    
    let subscriptions: any[] = [];
    
    try {
      // Only set up subscription if we have a valid conversation ID
      if (conversationId) {
        // Subscribe to message deletions by conversation ID
        const deleteChannel = supabase
          .channel('dm-deletions-by-conversation')
          .on('postgres_changes', 
              { 
                event: 'DELETE', 
                schema: 'public', 
                table: 'direct_messages',
                filter: `conversation_id=eq.${conversationId}`
              },
              (payload) => {
                if (payload.old) {
                  setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
              })
          .subscribe();
        subscriptions.push(deleteChannel);
  
        // Subscribe to new messages by conversation ID
        const insertChannel = supabase
          .channel('dm-insertions-by-conversation')
          .on('postgres_changes', 
              { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'direct_messages',
                filter: `conversation_id=eq.${conversationId}`
              },
              async (payload) => {
                if (payload.new) {
                  // Check if we should handle this message - sometimes we might have added it optimistically
                  const isOurOptimisticMessage = payload.new.sender_id === currentUserId;
                  
                  // If it's our message, we probably added it optimistically already
                  // But we'll update with the real DB id just in case
                  if (isOurOptimisticMessage) {
                    // Just update the ID in case it was optimistic
                    setMessages(prev => prev.map(msg => {
                      // If messages have same text and timestamp (approximately), update the ID
                      if (msg.text === payload.new.text && 
                          msg.sender?.id === payload.new.sender_id &&
                          Math.abs(new Date(msg.timestamp).getTime() - new Date(payload.new.timestamp).getTime()) < 5000) {
                        return {
                          ...msg,
                          id: payload.new.id
                        };
                      }
                      return msg;
                    }));
                    return;
                  }
                  
                  // If it's not our message, add it
                  try {
                    const { data: userData } = await supabase
                      .from('users')
                      .select('name, avatar')
                      .eq('id', payload.new.sender_id)
                      .single();
    
                    const newMessage = {
                      id: payload.new.id,
                      text: payload.new.text,
                      sender: {
                        id: payload.new.sender_id,
                        name: userData?.name || 'Unknown',
                        avatar: userData?.avatar
                      },
                      timestamp: payload.new.timestamp
                    };
    
                    // If we have a specific add function that checks for duplicates, use it
                    if (addMessage) {
                      addMessage(newMessage);
                    } else {
                      // Otherwise use the standard approach
                      setMessages(prev => [...prev, newMessage]);
                    }
                  } catch (error) {
                    console.error('Error fetching user data for message:', error);
                  }
                }
              })
          .subscribe();
        subscriptions.push(insertChannel);
        
        // Reset subscription error flag on successful subscription
        subscriptionError.current = false;
      }
    } catch (error) {
      console.error('Error setting up DM subscription:', error);
      
      // Show toast only once for subscription errors
      if (!subscriptionError.current) {
        toast({
          title: "Connection Error",
          description: "Could not set up message updates. You may need to refresh the page.",
          variant: "destructive"
        });
        subscriptionError.current = true;
      }
    }

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [conversationId, userId, currentUserId, setMessages, addMessage]);
};
