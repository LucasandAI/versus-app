
import { supabase } from '@/integrations/supabase/client';
import { DMConversation } from '../types';
import { toast } from '@/hooks/use-toast';

// Add default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

// Fetch basic conversation data
export const fetchBasicConversations = async (userId: string) => {
  console.log('[fetchBasicConversations] Fetching for user:', userId);
  
  const { data, error } = await supabase
    .from('direct_conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      created_at
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) throw error;

  if (!data || data.length === 0) {
    console.log('No conversations found for the current user');
    return [];
  }

  // Filter out self-conversations where user1_id === user2_id
  return data.filter(conv => conv.user1_id !== conv.user2_id);
};

// Get other user IDs from conversations
export const extractOtherUserIds = (
  conversations: any[], 
  userId: string
): string[] => {
  return conversations
    .map(conv => conv.user1_id === userId ? conv.user2_id : conv.user1_id)
    .filter(id => id !== userId); // Extra filter to ensure no self-IDs
};

// Convert basic conversation data to DMConversation format
export const createBasicConversationObjects = (
  conversations: any[], 
  userId: string
): Record<string, DMConversation> => {
  return conversations.reduce((acc: Record<string, DMConversation>, conv) => {
    // Skip self-conversations
    if (conv.user1_id === conv.user2_id) {
      return acc;
    }
    
    const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    
    // Skip if the other user is somehow the same as the current user
    if (otherUserId === userId) {
      return acc;
    }
    
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
};

// Process user data into a map for easy lookups
export const createUserMap = (
  userData: any[]
): Record<string, any> => {
  return (userData || []).reduce((acc: Record<string, any>, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
};

// Process message data to find the latest message for each conversation
export const createLatestMessageMap = (
  messagesData: any[]
): Record<string, any> => {
  return (messagesData || []).reduce((acc: Record<string, any>, msg) => {
    if (!acc[msg.conversation_id]) {
      acc[msg.conversation_id] = {
        text: msg.text,
        timestamp: msg.timestamp
      };
    }
    return acc;
  }, {});
};

// Build final conversation objects with user info and latest messages
export const buildFinalConversations = (
  validConversations: any[],
  userId: string,
  userMap: Record<string, any>,
  latestMessageMap: Record<string, any>
): DMConversation[] => {
  return validConversations
    .map(conv => {
      // Skip self-conversations
      if (conv.user1_id === conv.user2_id) {
        return null;
      }
      
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      
      // Skip if the other user is somehow the same as the current user
      if (otherUserId === userId) {
        return null;
      }
      
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
};

// Helper function to handle showing error toast
export const showErrorToast = (errorMessage: string, errorToastShown: boolean): boolean => {
  if (!errorToastShown) {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
    return true;
  }
  return errorToastShown;
};
