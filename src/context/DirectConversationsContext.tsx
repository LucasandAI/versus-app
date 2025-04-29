
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { supabase } from '@/integrations/supabase/client';
import { DMConversation } from '@/hooks/chat/dm/types';
import { toast } from '@/hooks/use-toast';

interface DirectConversationsContextType {
  conversations: DMConversation[];
  loading: boolean;
  hasFetched: boolean;
  fetchConversations: (forceRefresh?: boolean) => Promise<DMConversation[]>;
  refreshConversations: () => Promise<DMConversation[]>;
}

const DirectConversationsContext = createContext<DirectConversationsContextType | undefined>(undefined);

// Default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

export const DirectConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const isMounted = useRef(true);

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Core fetch logic
  const fetchConversations = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already fetched and not forcing refresh
    if (hasFetched && !forceRefresh) {
      console.log('[DirectConversationsContext] Using cached conversations, skipping fetch');
      return conversations;
    }

    // Strong guard clause to prevent fetching without session or user
    if (!isSessionReady || !currentUser?.id) {
      console.log('[DirectConversationsContext] Session or user not ready, skipping fetch');
      return [];
    }

    console.log('[DirectConversationsContext] Fetching conversations for user:', currentUser.id);
    setLoading(true);

    try {
      // Get conversations the current user is part of
      const { data: directConversations, error: conversationsError } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      if (conversationsError) {
        console.error('[DirectConversationsContext] Error fetching conversations:', conversationsError);
        if (isMounted.current) {
          toast({
            title: 'Error fetching conversations',
            description: 'Could not load your message history',
            variant: 'destructive',
          });
        }
        setLoading(false);
        return [];
      }

      if (!directConversations || directConversations.length === 0) {
        console.log('[DirectConversationsContext] No conversations found');
        setConversations([]);
        setHasFetched(true);
        setLoading(false);
        return [];
      }

      // Process the conversations to get the other user's details
      const processedConversations: DMConversation[] = await Promise.all(
        directConversations.map(async (conv) => {
          // Determine the other user ID (not the current user)
          const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;

          // Get the other user's details
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', otherUserId)
            .single();

          if (userError || !userData) {
            console.error(`[DirectConversationsContext] Error fetching user ${otherUserId}:`, userError);
            return {
              conversationId: conv.id,
              userId: otherUserId,
              userName: 'Unknown User',
              userAvatar: DEFAULT_AVATAR,
              timestamp: conv.created_at,
              lastMessage: '',
            };
          }

          // Get the latest message in this conversation
          const { data: latestMessage, error: messageError } = await supabase
            .from('direct_messages')
            .select('text, timestamp')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== 'PGRST116') {
            console.error(`[DirectConversationsContext] Error fetching latest message for conversation ${conv.id}:`, messageError);
          }

          return {
            conversationId: conv.id,
            userId: userData.id,
            userName: userData.name || 'Unknown User',
            userAvatar: userData.avatar || DEFAULT_AVATAR,
            timestamp: latestMessage?.timestamp || conv.created_at,
            lastMessage: latestMessage?.text || '',
          };
        })
      );

      // Filter out self-conversations
      const filteredConversations = processedConversations.filter(c => c.userId !== currentUser.id);
      
      // Sort by most recent message
      const sortedConversations = filteredConversations.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      if (isMounted.current) {
        console.log('[DirectConversationsContext] Setting', sortedConversations.length, 'conversations');
        setConversations(sortedConversations);
        setHasFetched(true);
      }

      return sortedConversations;
    } catch (error) {
      console.error('[DirectConversationsContext] Unexpected error fetching conversations:', error);
      if (isMounted.current) {
        toast({
          title: 'Error fetching conversations',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, isSessionReady, hasFetched, conversations]);

  // Public method to force refresh
  const refreshConversations = useCallback(() => {
    return fetchConversations(true);
  }, [fetchConversations]);

  // Reset state when user changes
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setHasFetched(false);
    }
  }, [currentUser]);

  const contextValue: DirectConversationsContextType = {
    conversations,
    loading,
    hasFetched,
    fetchConversations,
    refreshConversations
  };

  return (
    <DirectConversationsContext.Provider value={contextValue}>
      {children}
    </DirectConversationsContext.Provider>
  );
};

export const useDirectConversationsContext = () => {
  const context = useContext(DirectConversationsContext);
  if (context === undefined) {
    throw new Error('useDirectConversationsContext must be used within a DirectConversationsProvider');
  }
  return context;
};
