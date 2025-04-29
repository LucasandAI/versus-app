
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Conversation } from './types';

export const useConversationManagement = (currentUserId: string | undefined) => {
  const getOrCreateConversation = useCallback(async (
    userId: string, 
    userName: string, 
    userAvatar = '/placeholder.svg'
  ): Promise<Conversation | null> => {
    if (!currentUserId) {
      console.warn('[getOrCreateConversation] Cannot get conversation, no current user');
      return null;
    }
    
    try {
      // Check for existing conversation in database
      const { data: existingConv, error: fetchError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`)
        .maybeSingle();
        
      if (fetchError) {
        throw fetchError;
      }
      
      let conversationId: string;
      
      if (existingConv) {
        // Use existing conversation
        conversationId = existingConv.id;
        console.log('[getOrCreateConversation] Found existing conversation:', conversationId);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: currentUserId,
            user2_id: userId
          })
          .select('id')
          .single();
          
        if (createError) {
          throw createError;
        }
        
        conversationId = newConv.id;
        console.log('[getOrCreateConversation] Created new conversation:', conversationId);
      }
      
      // Create conversation object
      const conversation: Conversation = {
        conversationId,
        userId,
        userName,
        userAvatar
      };
      
      return conversation;
      
    } catch (error) {
      console.error('[getOrCreateConversation] Error:', error);
      toast({
        title: "Error",
        description: "Could not load or create conversation",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUserId]);

  return { getOrCreateConversation };
};
