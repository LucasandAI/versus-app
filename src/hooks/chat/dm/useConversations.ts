
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useDirectConversations } from './useDirectConversations';
import { DMConversation } from './types';
import { toast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

export type { DMConversation } from './types';

const SUBSCRIPTION_DELAY_MS = 300; // Increased delay before setting up subscriptions

export const useConversations = (hiddenDMIds: string[] = []) => {
  const { currentUser } = useApp();
  const { 
    conversations, 
    loading, 
    fetchConversations
  } = useDirectConversations([]);
  const subscriptionError = useRef(false);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  
  // Debounced fetch for realtime updates to prevent multiple rapid fetches
  const debouncedFetch = useRef(
    debounce(() => {
      if (currentUser?.id && isMounted.current) {
        console.log('Debounced fetch triggered by realtime update');
        fetchConversations();
      }
    }, 300) // 300ms debounce time
  ).current;
  
  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      debouncedFetch.cancel();
      
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
    };
  }, [debouncedFetch]);
  
  // Subscribe to real-time updates for conversations
  useEffect(() => {
    // Guard clause: Early return if no user ID
    if (!currentUser?.id) return;
    
    // Clear any existing timeout
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
    }
    
    // Set a small delay before setting up subscriptions
    subscriptionTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      try {
        console.log(`Setting up realtime subscriptions for user ${currentUser.id} after delay`);
        
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
                debouncedFetch();
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
                debouncedFetch();
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
                debouncedFetch();
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
                debouncedFetch();
              })
          .subscribe();
        channels.push(receiverChannel);
        
        // Reset subscription error flag on successful subscription setup
        subscriptionError.current = false;
        
        return () => {
          if (isMounted.current) {
            console.log('Cleaning up realtime subscriptions');
            channels.forEach(channel => {
              supabase.removeChannel(channel);
            });
          }
        };
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
        
        // Show toast only once for subscription errors
        if (!subscriptionError.current && isMounted.current) {
          toast({
            title: "Connection Error",
            description: "Could not set up real-time updates. Messages may be delayed.",
            variant: "destructive"
          });
          subscriptionError.current = true;
        }
      }
    }, SUBSCRIPTION_DELAY_MS);
    
    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
    };
  }, [currentUser?.id, debouncedFetch]);

  return {
    conversations,
    loading,
    fetchConversations
  };
};
