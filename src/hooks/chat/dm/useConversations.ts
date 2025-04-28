
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useDirectConversations } from './useDirectConversations';
import { DMConversation } from './types';

export type { DMConversation } from './types';

export const useConversations = (hiddenDMIds: string[] = []) => {
  const { currentUser } = useApp();
  const { 
    conversations, 
    loading, 
    fetchConversations, 
    updateConversation 
  } = useDirectConversations(hiddenDMIds);
  
  // Subscribe to real-time updates for conversations
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Start fetching immediately when component mounts
    fetchConversations();
    
    // Subscribe to new conversations
    const newConversationChannel = supabase
      .channel('new-conversations')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_conversations',
            filter: `or(user1_id=eq.${currentUser.id},user2_id=eq.${currentUser.id})`
          },
          () => {
            fetchConversations();
          })
      .subscribe();
    
    // Subscribe to new messages that might update conversation previews
    const messageChannel = supabase
      .channel('dm-conversation-updates')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `or(sender_id=eq.${currentUser.id},receiver_id=eq.${currentUser.id})`
          },
          () => {
            fetchConversations();
          })
      .subscribe();
    
    return () => {
      supabase.removeChannel(newConversationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [currentUser?.id, fetchConversations]);

  return {
    conversations,
    loading,
    updateConversation,
    fetchConversations
  };
};
