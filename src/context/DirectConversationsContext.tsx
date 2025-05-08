import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';
import { toast } from '@/hooks/use-toast';

interface Conversation {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage?: string;
  timestamp?: string;  // Added timestamp property
}

interface DirectConversationsContextValue {
  conversations: Conversation[];
  loading: boolean;
  hasLoaded: boolean;
  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string, userName: string, userAvatar?: string) => Promise<Conversation | null>;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { currentUser } = useApp();

  // Add function to fetch conversation details
  const fetchConversationDetails = useCallback(async (conversationId: string) => {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      const otherUserId = conversation.user1_id === currentUser?.id ? conversation.user2_id : conversation.user1_id;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', otherUserId)
        .single();

      if (userError) throw userError;

      setConversations(prev => [...prev, {
        conversationId: conversation.id,
        userId: userData.id,
        userName: userData.name,
        userAvatar: userData.avatar || '/placeholder.svg',
        lastMessage: '',
        timestamp: conversation.created_at
      }]);
    } catch (error) {
      console.error('[DirectConversationsProvider] Error fetching conversation details:', error);
    }
  }, [currentUser?.id]);

  // Add real-time subscription for new messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('direct-messages-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages' 
        },
        async (payload) => {
          if (payload.new.sender_id === currentUser.id || payload.new.receiver_id === currentUser.id) {
            // Update the conversation list with the new message
            setConversations(prev => {
              const updatedConversations = [...prev];
              const conversationIndex = updatedConversations.findIndex(
                conv => conv.conversationId === payload.new.conversation_id
              );

              if (conversationIndex !== -1) {
                // Update existing conversation
                updatedConversations[conversationIndex] = {
                  ...updatedConversations[conversationIndex],
                  lastMessage: payload.new.text,
                  timestamp: payload.new.timestamp
                };
              } else {
                // Fetch conversation details if it's a new conversation
                fetchConversationDetails(payload.new.conversation_id);
              }

              // Sort conversations by timestamp
              return updatedConversations.sort((a, b) => {
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchConversationDetails]);

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
      
      // Get all conversations where the current user is a participant
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
        
      if (conversationsError) {
        throw conversationsError;
      }
      
      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setHasLoaded(true);
        setLoading(false);
        return;
      }
      
      // Get the other participant's details for each conversation
      const conversationsWithUserDetails: Conversation[] = [];
      
      for (const conv of conversationsData) {
        // Skip self-conversations if any
        if (conv.user1_id === conv.user2_id) {
          console.log('[DirectConversationsProvider] Skipping self-conversation:', conv.id);
          continue;
        }
        
        // Determine which user is the other participant
        const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
        
        // Get other user's details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', otherUserId)
          .single();
          
        if (userError) {
          console.error('[DirectConversationsProvider] Error fetching user data:', userError);
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
          console.error('[DirectConversationsProvider] Error fetching latest message:', messageError);
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
      
      setConversations(conversationsWithUserDetails);
      setHasLoaded(true);
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, hasLoaded]);
  
  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);
  
  const getOrCreateConversation = useCallback(async (
    userId: string, 
    userName: string, 
    userAvatar = '/placeholder.svg'
  ): Promise<Conversation | null> => {
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
      const conversation: Conversation = {
        conversationId,
        userId,
        userName,
        userAvatar
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
