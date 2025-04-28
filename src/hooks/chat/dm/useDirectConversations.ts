
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { DMConversation } from './types';

const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();
  
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.id) return [];
    
    try {
      setLoading(true);
      
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
      
      if (conversationsError) throw conversationsError;
      
      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setLoading(false);
        return [];
      }
      
      const otherUserIds = conversationsData.map(conv => 
        conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id
      );
      
      const basicConversations = conversationsData.reduce((acc: Record<string, DMConversation>, conv) => {
        const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
        
        if (hiddenDMIds.includes(otherUserId)) return acc;
        
        acc[otherUserId] = {
          conversationId: conv.id,
          userId: otherUserId,
          userName: "Loading...",
          userAvatar: DEFAULT_AVATAR,
          lastMessage: "",
          timestamp: conv.created_at,
          isLoading: true
        };
        return acc;
      }, {});
      
      const initialConversations = Object.values(basicConversations)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setConversations(initialConversations);
      
      // Fetch user information and latest messages in parallel
      const userPromise = supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', otherUserIds);
      
      const messagesPromise = supabase
        .from('direct_messages')
        .select('conversation_id, text, timestamp')
        .in('conversation_id', conversationsData.map(c => c.id))
        .order('timestamp', { ascending: false });
      
      const [userResult, messagesResult] = await Promise.all([userPromise, messagesPromise]);
      
      if (userResult.error) throw userResult.error;
      if (messagesResult.error) throw messagesResult.error;
      
      const userMap = (userResult.data || []).reduce((acc: Record<string, any>, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      const latestMessageMap = messagesResult.data?.reduce((acc: Record<string, any>, msg) => {
        if (!acc[msg.conversation_id]) {
          acc[msg.conversation_id] = {
            text: msg.text,
            timestamp: msg.timestamp
          };
        }
        return acc;
      }, {});
      
      const updatedConversations = conversationsData
        .map(conv => {
          const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
          
          if (hiddenDMIds.includes(otherUserId)) return null;
          
          const otherUser = userMap[otherUserId];
          const latestMessage = latestMessageMap[conv.id];
          
          return {
            conversationId: conv.id,
            userId: otherUserId,
            userName: otherUser?.name || 'Unknown User',
            userAvatar: otherUser?.avatar || DEFAULT_AVATAR,
            lastMessage: latestMessage?.text || '',
            timestamp: latestMessage?.timestamp || conv.created_at
          };
        })
        .filter((conv): conv is DMConversation => conv !== null)
        .sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      
      setConversations(updatedConversations);
      return updatedConversations;
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, hiddenDMIds, unhideConversation]);
  
  return {
    conversations,
    loading,
    fetchConversations
  };
};
