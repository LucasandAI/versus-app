import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { DMConversation } from './types';

// Ensure we always have an avatar by using a placeholder
const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useApp();
  const { unhideConversation } = useHiddenDMs();
  
  // Fetch conversations from Supabase
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.id) return [];
    
    try {
      setLoading(true);
      
      // Get all conversations where the current user is either user1 or user2
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
      
      // Get the IDs of the other users in each conversation
      const otherUserIds = conversationsData.map(conv => 
        conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id
      );
      
      // Fetch user information for those IDs
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', otherUserIds);
      
      if (userError) throw userError;
      
      // Create a map for quick user data lookup
      const userMap = (userData || []).reduce((acc: Record<string, any>, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      // Get the most recent message for each conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('conversation_id, text, timestamp, sender_id')
        .in('conversation_id', conversationsData.map(c => c.id))
        .order('timestamp', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      // Create a map of the most recent message for each conversation
      const latestMessageMap: Record<string, {text: string, timestamp: string, senderId: string}> = {};
      messagesData?.forEach(msg => {
        if (!latestMessageMap[msg.conversation_id]) {
          latestMessageMap[msg.conversation_id] = {
            text: msg.text,
            timestamp: msg.timestamp,
            senderId: msg.sender_id
          };
        }
      });
      
      // Format conversations with user info and latest message
      const formattedConversations = conversationsData
        .map(conv => {
          const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
          const otherUser = userMap[otherUserId];
          
          if (!otherUser) return null;
          
          const latestMessage = latestMessageMap[conv.id];
          
          return {
            conversationId: conv.id,
            userId: otherUser.id,
            userName: otherUser.name || 'Unknown User',
            userAvatar: otherUser.avatar || DEFAULT_AVATAR, // Always provide an avatar
            lastMessage: latestMessage?.text || '',
            timestamp: latestMessage?.timestamp || conv.created_at,
            isInitiator: latestMessage ? latestMessage.senderId === currentUser.id : false
          };
        })
        .filter((conv): conv is DMConversation => 
          conv !== null && !hiddenDMIds.includes(conv.userId)
        )
        .sort((a, b) => 
          // Sort by timestamp, newest first
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      
      setConversations(formattedConversations);
      return formattedConversations;
      
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
  
  // Fetch conversations when component mounts or dependencies change
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Function to add or update a conversation in the state
  const updateConversation = useCallback((conversationId: string, userId: string, message: string, userName: string, userAvatar: string) => {
    setConversations(prevConversations => {
      // Check if the conversation already exists
      const existingIndex = prevConversations.findIndex(
        conv => conv.conversationId === conversationId || conv.userId === userId
      );
      
      const updatedConversation: DMConversation = {
        conversationId,
        userId,
        userName,
        userAvatar,
        lastMessage: message,
        timestamp: new Date().toISOString(),
        isInitiator: true
      };
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prevConversations];
        updated[existingIndex] = updatedConversation;
        
        // Sort to ensure the updated conversation appears at the top
        return updated.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } else {
        // Add new conversation
        return [updatedConversation, ...prevConversations];
      }
    });
  }, []);
  
  return {
    conversations,
    loading,
    fetchConversations,
    updateConversation
  };
};
