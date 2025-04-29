
import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { DMConversation } from './types';
import debounce from 'lodash/debounce';

// Add default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isSessionReady } = useApp();
  const errorToastShown = useRef(false);
  const attemptedFetch = useRef(false);
  const isMounted = useRef(true);

  const debouncedFetchConversations = useRef(
    debounce(async (userId: string) => {
      if (!isMounted.current || !userId) return;
      
      try {
        console.log('[useDirectConversations] Fetching conversations for user:', userId);
        setLoading(true);
        attemptedFetch.current = true;

        const { data: conversationsData, error: conversationsError } = await supabase
          .from('direct_conversations')
          .select(`
            id,
            user1_id,
            user2_id,
            created_at
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (!isMounted.current) return;

        if (conversationsError) throw conversationsError;

        if (!conversationsData || conversationsData.length === 0) {
          console.log('No conversations found for the current user');
          setConversations([]);
          setLoading(false);
          return [];
        }

        const otherUserIds = conversationsData.map(conv => 
          conv.user1_id === userId ? conv.user2_id : conv.user1_id
        );

        if (otherUserIds.length === 0) {
          console.log('No conversations found');
          setConversations([]);
          setLoading(false);
          return [];
        }

        const basicConversations = conversationsData.reduce((acc: Record<string, DMConversation>, conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          
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

        if (!isMounted.current) return;

        setConversations(initialConversations);

        errorToastShown.current = false;

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

        if (!isMounted.current) return;

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
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
            
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

        if (!isMounted.current) return;

        setConversations(updatedConversations);
        return updatedConversations;

      } catch (error) {
        if (!isMounted.current) return;
        
        console.error('[useDirectConversations] Error fetching conversations:', error);
        
        if (!errorToastShown.current) {
          toast({
            title: "Error",
            description: "Could not load conversations. Please try again later.",
            variant: "destructive"
          });
          errorToastShown.current = true;
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, 100)
  ).current;

  const fetchConversations = useCallback(() => {
    // Add guard clause to prevent fetching without session or user
    if (!isSessionReady || !currentUser?.id) {
      console.log('[useDirectConversations] Session or user not ready, skipping fetch');
      return Promise.resolve([]);
    }

    console.log('[useDirectConversations] Session and user ready, fetching conversations');
    return debouncedFetchConversations(currentUser.id);
  }, [currentUser?.id, isSessionReady, debouncedFetchConversations]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      debouncedFetchConversations.cancel();
    };
  }, [debouncedFetchConversations]);

  // Only attempt fetch when both session is ready AND user ID exists
  useEffect(() => {
    if (isSessionReady && currentUser?.id) {
      console.log('[useDirectConversations] Session AND user ready, triggering fetch');
      fetchConversations();
    }
  }, [isSessionReady, currentUser?.id, fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations
  };
};
