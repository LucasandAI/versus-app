
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Conversation } from './types';

export const useFetchConversations = (currentUserId: string | undefined) => {
  const [errorToastShown, setErrorToastShown] = useState(false);
  
  const fetchConversations = useCallback(async () => {
    try {
      // Strong guard clause - prevent fetching without a user ID or if it's not ready
      if (!currentUserId) {
        console.log('[fetchConversations] No current user ID, skipping fetch');
        return [];
      }

      console.log('[fetchConversations] Fetching conversations for user:', currentUserId);
      
      // Get all conversations where the current user is a participant
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
        
      if (conversationsError) throw conversationsError;
      
      if (!conversationsData || conversationsData.length === 0) {
        return [];
      }
      
      // Get the other participant's details for each conversation
      const conversationsWithUserDetails: Conversation[] = [];
      
      for (const conv of conversationsData) {
        // Skip self-conversations if any
        if (conv.user1_id === conv.user2_id) {
          console.log('[fetchConversations] Skipping self-conversation:', conv.id);
          continue;
        }
        
        // Determine which user is the other participant
        const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
        
        // Get other user's details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', otherUserId)
          .single();
          
        if (userError) {
          console.error('[fetchConversations] Error fetching user data:', userError);
          continue;
        }
        
        // Get latest message
        const { data: latestMessage, error: messageError } = await supabase
          .from('direct_messages')
          .select('text, timestamp')
          .eq('conversation_id', conv.id)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (messageError) {
          console.error('[fetchConversations] Error fetching latest message:', messageError);
        }
        
        conversationsWithUserDetails.push({
          conversationId: conv.id,
          userId: userData.id,
          userName: userData.name,
          userAvatar: userData.avatar || '/placeholder.svg',
          lastMessage: latestMessage && latestMessage[0] ? latestMessage[0].text : undefined,
          timestamp: latestMessage && latestMessage[0] ? latestMessage[0].timestamp : undefined
        });
      }
      
      // Sort conversations by last message time (most recent first)
      conversationsWithUserDetails.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Reset error toast flag on successful fetch
      setErrorToastShown(false);
      
      return conversationsWithUserDetails;
      
    } catch (error) {
      console.error('[fetchConversations] Error fetching conversations:', error);
      
      // Only show toast message once per error session
      if (!errorToastShown) {
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive"
        });
        setErrorToastShown(true);
      }
      
      return [];
    }
  }, [currentUserId, errorToastShown]);

  return fetchConversations;
};
