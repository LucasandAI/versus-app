
import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { DMConversation } from './types';
import debounce from 'lodash/debounce';

const DEFAULT_AVATAR = '/placeholder.svg';
const FETCH_DELAY_MS = 300; // Increased delay before fetching

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();
  const errorToastShown = useRef(false);
  const attemptedFetch = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  
  // Create a debounced version of the fetch function to prevent rapid successive calls
  const debouncedFetchConversations = useRef(
    debounce(async (userId: string) => {
      if (!isMounted.current || !userId) return;
      
      try {
        setLoading(true);
        attemptedFetch.current = true;
        
        console.log(`Fetching conversations for user: ${userId} (debounced)`);
        
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('direct_conversations')
          .select(`
            id,
            user1_id,
            user2_id,
            created_at
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        
        if (!isMounted.current) return; // Check if component is still mounted
        
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
        
        const basicConversations = conversationsData.reduce((acc: Record<string, DMConversation>, conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          
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
        
        if (!isMounted.current) return; // Check if component is still mounted
        
        setConversations(initialConversations);
        
        // Reset error toast flag on successful fetch
        errorToastShown.current = false;
        
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
        
        if (!isMounted.current) return; // Check if component is still mounted
        
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
        
        if (!isMounted.current) return; // Check if component is still mounted
        
        setConversations(updatedConversations);
        return updatedConversations;
        
      } catch (error) {
        if (!isMounted.current) return; // Check if component is still mounted
        
        console.error('Error fetching conversations:', error);
        
        // Show toast only once per session
        if (!errorToastShown.current) {
          toast({
            title: "Error",
            description: "Could not load conversations. Please try again later.",
            variant: "destructive"
          });
          errorToastShown.current = true;
        }
        
        return [];
      } finally {
        // Ensure loading state is always reset, even on error
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, 300) // 300ms debounce
  ).current;
  
  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      debouncedFetchConversations.cancel();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [debouncedFetchConversations]);
  
  // Expose a stable fetch function that checks user ID first
  const fetchConversations = useCallback(() => {
    if (!currentUser?.id) {
      console.log('Cannot fetch conversations: currentUser.id is undefined');
      setLoading(false);
      return Promise.resolve([]);
    }
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set a delayed fetch to ensure auth is fully ready
    return new Promise(resolve => {
      fetchTimeoutRef.current = setTimeout(() => {
        console.log(`Delayed fetch execution after ${FETCH_DELAY_MS}ms for user ${currentUser.id}`);
        debouncedFetchConversations(currentUser.id).then(resolve);
      }, FETCH_DELAY_MS);
    });
  }, [currentUser?.id, debouncedFetchConversations]);
  
  // Add an effect to trigger fetch when currentUser becomes available
  useEffect(() => {
    if (currentUser?.id && !attemptedFetch.current) {
      console.log('User ID now available, scheduling fetch with delay');
      fetchConversations();
    }
  }, [currentUser?.id, fetchConversations]);
  
  return {
    conversations,
    loading,
    fetchConversations
  };
};
