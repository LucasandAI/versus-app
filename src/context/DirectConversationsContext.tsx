import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';
import { toast } from '@/hooks/use-toast';
import { useConversationsFetcher } from '@/hooks/chat/dm/useConversationsFetcher';
import { DMConversation } from '@/hooks/chat/dm/types';

interface DirectConversationsContextValue {
  conversations: DMConversation[];
  loading: boolean;
  hasLoaded: boolean;
  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string, userName: string, userAvatar?: string) => Promise<DMConversation | null>;
}

const DirectConversationsContext = createContext<DirectConversationsContextValue>({
  conversations: [],
  loading: false,
  hasLoaded: false,
  fetchConversations: async () => {},
  refreshConversations: async () => {},
  getOrCreateConversation: async () => null,
});

export const useDirectConversationsContext = () => useContext(DirectConversationsContext);

export const DirectConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { currentUser } = useApp();
  const isMounted = useRef(true);
  const { debouncedFetchConversations } = useConversationsFetcher(isMounted);

  const fetchConversations = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoaded) {
      console.log('[DirectConversationsProvider] Using cached conversations');
      return;
    }
    
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot fetch conversations, no current user');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[DirectConversationsProvider] Fetching conversations for user:', currentUser.id);
      
      await debouncedFetchConversations(currentUser.id, setLoading, (convs: DMConversation[]) => {
        if (isMounted.current) {
          setConversations(convs);
          setHasLoaded(true);
        }
      });
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, hasLoaded, debouncedFetchConversations]);
  
  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);
  
  const getOrCreateConversation = useCallback(async (
    userId: string, 
    userName: string, 
    userAvatar = '/placeholder.svg'
  ): Promise<DMConversation | null> => {
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot get conversation, no current user');
      return null;
    }
    
    try {
      // Check if we already have this conversation in our local state
      const existingConversation = conversations.find(c => c.userId === userId);
      if (existingConversation) {
        return existingConversation;
      }
      
      // Check for existing conversation in database
      const { data: existingConv, error: fetchError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`)
        .maybeSingle();
        
      if (fetchError) {
        throw fetchError;
      }
      
      let conversationId: string;
      
      if (existingConv) {
        // Use existing conversation
        conversationId = existingConv.id;
        console.log('[DirectConversationsProvider] Found existing conversation:', conversationId);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: currentUser.id,
            user2_id: userId
          })
          .select('id')
          .single();
          
        if (createError) {
          throw createError;
        }
        
        conversationId = newConv.id;
        console.log('[DirectConversationsProvider] Created new conversation:', conversationId);
      }
      
      // Create conversation object
      const conversation: DMConversation = {
        conversationId,
        userId,
        userName,
        userAvatar,
        lastMessage: '',
        timestamp: new Date().toISOString()
      };
      
      // Update local state
      setConversations(prev => {
        // Don't add duplicate
        if (prev.some(c => c.conversationId === conversationId)) {
          return prev;
        }
        return [conversation, ...prev];
      });
      
      return conversation;
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error in getOrCreateConversation:', error);
      toast({
        title: "Error",
        description: "Could not load or create conversation",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser?.id, conversations]);
  
  // Cleanup effect
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const contextValue: DirectConversationsContextValue = {
    conversations,
    loading,
    hasLoaded,
    fetchConversations,
    refreshConversations,
    getOrCreateConversation
  };
  
  return (
    <DirectConversationsContext.Provider value={contextValue}>
      {children}
    </DirectConversationsContext.Provider>
  );
};
