import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useConversationManagement = (currentUserId?: string, otherUserId?: string) => {
  // Create a new conversation between two users
  const createConversation = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      console.error('[useConversationManagement] Cannot create conversation: missing user IDs');
      return null;
    }

    try {
      console.log(`[useConversationManagement] Creating conversation between ${currentUserId} and ${otherUserId}`);
      
      // First check if a conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .or(`user1_id.eq.${otherUserId},user2_id.eq.${otherUserId}`)
        .maybeSingle();

      if (checkError) {
        console.error('[useConversationManagement] Error checking existing conversation:', checkError);
      }

      // If conversation exists, return its ID
      if (existingConversation?.id) {
        console.log(`[useConversationManagement] Found existing conversation: ${existingConversation.id}`);
        return existingConversation.id;
      }

      // Otherwise create a new conversation
      const conversationId = uuidv4();
      
      const { error } = await supabase
        .from('direct_conversations')
        .insert({
          id: conversationId,
          user1_id: currentUserId,
          user2_id: otherUserId
        });

      if (error) {
        console.error('[useConversationManagement] Error creating conversation:', error);
        return null;
      }

      console.log(`[useConversationManagement] Created new conversation: ${conversationId}`);
      return conversationId;
    } catch (error) {
      console.error('[useConversationManagement] Exception creating conversation:', error);
      return null;
    }
  }, [currentUserId, otherUserId]);

  // Get an existing conversation or create a new one
  const getOrCreateConversation = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      console.error('[useConversationManagement] Cannot get/create conversation: missing user IDs');
      return null;
    }

    try {
      // First check if a conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId})`)
        .or(`and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)
        .maybeSingle();

      if (checkError) {
        console.error('[useConversationManagement] Error checking existing conversation:', checkError);
        throw checkError;
      }

      // If conversation exists, return its ID
      if (existingConversation?.id) {
        console.log(`[useConversationManagement] Found existing conversation: ${existingConversation.id}`);
        return existingConversation.id;
      }

      // Otherwise create a new conversation
      return await createConversation();
    } catch (error) {
      console.error('[useConversationManagement] Error in getOrCreateConversation:', error);
      return null;
    }
  }, [currentUserId, otherUserId, createConversation]);

  return {
    createConversation,
    getOrCreateConversation
  };
};
