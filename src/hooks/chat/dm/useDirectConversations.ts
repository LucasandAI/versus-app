
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
      
      // Step 1: Get all conversations where the current user is either user1 or user2
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
      
      // Create a basic map of conversation objects (with minimal data)
      const basicConversations = conversationsData.reduce((acc: Record<string, DMConversation>, conv) => {
        const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
        
        // Skip hidden conversations
        if (hiddenDMIds.includes(otherUserId)) return acc;
        
        acc[otherUserId] = {
          conversationId: conv.id,
          userId: otherUserId,
          userName: "Loading...", // Will be updated with real data
          userAvatar: DEFAULT_AVATAR,
          lastMessage: "",
          timestamp: conv.created_at,
          isInitiator: false, // Always set a default value
          isLoading: true
        };
        return acc;
      }, {});
      
      // Set immediate basic conversations data
      const initialConversations = Object.values(basicConversations)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setConversations(initialConversations);
      
      // Step 2: In parallel, fetch user information and latest messages
      
      // Fetch user information for those IDs
      const userPromise = supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', otherUserIds);
      
      // Get the most recent message for each conversation
      const messagesPromise = supabase
        .from('direct_messages')
        .select('conversation_id, text, timestamp, sender_id')
        .in('conversation_id', conversationsData.map(c => c.id))
        .order('timestamp', { ascending: false });
      
      // Wait for both promises to resolve
      const [userResult, messagesResult] = await Promise.all([userPromise, messagesPromise]);
      
      if (userResult.error) throw userResult.error;
      if (messagesResult.error) throw messagesResult.error;
      
      // Create a map for quick user data lookup
      const userMap = (userResult.data || []).reduce((acc: Record<string, any>, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      
      // Create a map of the most recent message for each conversation
      const latestMessageMap: Record<string, {text: string, timestamp: string, senderId: string}> = {};
      messagesResult.data?.forEach(msg => {
        if (!latestMessageMap[msg.conversation_id]) {
          latestMessageMap[msg.conversation_id] = {
            text: msg.text,
            timestamp: msg.timestamp,
            senderId: msg.sender_id
          };
        }
      });
      
      // Update conversations with user info and latest message
      const updatedConversations = conversationsData
        .map(conv => {
          const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
          
          // Skip if this conversation should be hidden
          if (hiddenDMIds.includes(otherUserId)) return null;
          
          const otherUser = userMap[otherUserId];
          const latestMessage = latestMessageMap[conv.id];
          
          // Ensure we always have a valid DMConversation object
          return {
            conversationId: conv.id,
            userId: otherUserId,
            userName: otherUser?.name || 'Unknown User',
            userAvatar: otherUser?.avatar || DEFAULT_AVATAR, 
            lastMessage: latestMessage?.text || '',
            timestamp: latestMessage?.timestamp || conv.created_at,
            isInitiator: latestMessage ? latestMessage.senderId === currentUser.id : false
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
        userAvatar: userAvatar || DEFAULT_AVATAR,
        lastMessage: message,
        timestamp: new Date().toISOString(),
        isInitiator: true // This is set since we're creating/updating the conversation
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
