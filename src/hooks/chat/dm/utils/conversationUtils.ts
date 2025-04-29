
import { supabase } from '@/integrations/supabase/client';
import { DMConversation } from '../types';
import { toast } from '@/hooks/use-toast';

export const fetchBasicConversations = async (userId: string) => {
  const { data: conversations, error } = await supabase
    .from('direct_conversations')
    .select('id, user1_id, user2_id, created_at')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
  if (error) throw error;
  if (!conversations) return [];
  
  // Filter out self-conversations where user1_id === user2_id
  return conversations.filter(conv => 
    conv.user1_id !== conv.user2_id && 
    (conv.user1_id === userId || conv.user2_id === userId)
  );
};

export const extractOtherUserIds = (conversations: any[], currentUserId: string) => {
  const otherUserIds = new Set<string>();
  
  conversations.forEach(conv => {
    // Determine which user is the other participant
    const otherUserId = 
      conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    
    // Make sure we're not adding ourselves
    if (otherUserId !== currentUserId) {
      otherUserIds.add(otherUserId);
    }
  });
  
  return Array.from(otherUserIds);
};

export const createBasicConversationObjects = (conversations: any[], currentUserId: string) => {
  const conversationMap: Record<string, DMConversation> = {};
  
  conversations.forEach(conv => {
    const otherUserId = 
      conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    
    // Skip self-conversations
    if (otherUserId === currentUserId) return;
    
    conversationMap[conv.id] = {
      conversationId: conv.id,
      userId: otherUserId,
      userName: "Loading...", // Placeholder name
      userAvatar: "/placeholder.svg", // Placeholder avatar
      lastMessage: "",
      timestamp: conv.created_at,
      isLoading: true
    };
  });
  
  return conversationMap;
};

export const createUserMap = (users: any[]) => {
  const userMap: Record<string, any> = {};
  
  users.forEach(user => {
    userMap[user.id] = {
      id: user.id,
      name: user.name || "Unknown User",
      avatar: user.avatar || "/placeholder.svg"
    };
  });
  
  return userMap;
};

export const createLatestMessageMap = (messages: any[]) => {
  const messageMap: Record<string, any> = {};
  
  messages.forEach(msg => {
    const conversationId = msg.conversation_id;
    
    if (!messageMap[conversationId] || 
        new Date(msg.timestamp) > new Date(messageMap[conversationId].timestamp)) {
      messageMap[conversationId] = {
        text: msg.text,
        timestamp: msg.timestamp
      };
    }
  });
  
  return messageMap;
};

export const buildFinalConversations = (
  conversations: any[], 
  currentUserId: string, 
  userMap: Record<string, any>,
  messageMap: Record<string, any>
) => {
  return conversations.map(conv => {
    const conversationId = conv.id;
    const otherUserId = 
      conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    
    // Skip self-conversations
    if (otherUserId === currentUserId) return null;
    
    const otherUser = userMap[otherUserId];
    const latestMessage = messageMap[conversationId];
    
    if (!otherUser) return null;
    
    return {
      conversationId: conversationId,
      userId: otherUserId,
      userName: otherUser.name,
      userAvatar: otherUser.avatar,
      lastMessage: latestMessage?.text || "",
      timestamp: latestMessage?.timestamp || conv.created_at,
    };
  }).filter(Boolean); // Filter out null values
};

export const showErrorToast = (message: string, hasShownToast: boolean): boolean => {
  if (hasShownToast) return true;
  
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
  
  return true;
};
