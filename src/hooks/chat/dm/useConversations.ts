
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useDirectConversations } from './useDirectConversations';
import { DMConversation } from './types';
import { toast } from '@/hooks/use-toast';

export type { DMConversation } from './types';

export const useConversations = (hiddenDMIds: string[] = []) => {
  const { currentUser } = useApp();
  const { 
    conversations, 
    loading, 
    fetchConversations
  } = useDirectConversations(hiddenDMIds);
  const subscriptionError = useRef(false);
  
  // Subscribe to real-time updates for conversations
  useEffect(() => {
    if (!currentUser?.id) return;
    
    try {
      // Start fetching immediately when component mounts
      fetchConversations();
      
      // Create channels for subscriptions
      const channels = [];
      
      // Subscribe to new conversations where user is user1
      const user1Channel = supabase
        .channel('new-conversations-user1')
        .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'direct_conversations',
              filter: `user1_id=eq.${currentUser.id}`
            },
            () => {
              console.log('New conversation detected (user1)');
              fetchConversations();
            })
        .subscribe();
      channels.push(user1Channel);
      
      // Subscribe to new conversations where user is user2
      const user2Channel = supabase
        .channel('new-conversations-user2')
        .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'direct_conversations',
              filter: `user2_id=eq.${currentUser.id}`
            },
            () => {
              console.log('New conversation detected (user2)');
              fetchConversations();
            })
        .subscribe();
      channels.push(user2Channel);
      
      // Subscribe to new messages where user is sender
      const senderChannel = supabase
        .channel('dm-sender-updates')
        .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'direct_messages',
              filter: `sender_id=eq.${currentUser.id}`
            },
            () => {
              console.log('New message sent detected');
              fetchConversations();
            })
        .subscribe();
      channels.push(senderChannel);
      
      // Subscribe to new messages where user is receiver
      const receiverChannel = supabase
        .channel('dm-receiver-updates')
        .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'direct_messages',
              filter: `receiver_id=eq.${currentUser.id}`
            },
            () => {
              console.log('New message received detected');
              fetchConversations();
            })
        .subscribe();
      channels.push(receiverChannel);
      
      // Reset subscription error flag on successful subscription setup
      subscriptionError.current = false;
      
      return () => {
        channels.forEach(channel => {
          supabase.removeChannel(channel);
        });
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      
      // Show toast only once for subscription errors
      if (!subscriptionError.current) {
        toast({
          title: "Connection Error",
          description: "Could not set up real-time updates. Messages may be delayed.",
          variant: "destructive"
        });
        subscriptionError.current = true;
      }
    }
  }, [currentUser?.id, fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations
  };
};
