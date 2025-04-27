
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { useUserData } from './useUserData';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import type { DMConversation } from './types';

export type { DMConversation };

export const useConversations = (hiddenDMs: string[]) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { currentUser } = useApp();
  const { userCache, setUserCache, fetchUserData } = useUserData();

  const updateConversation = useCallback((otherUserId: string, newMessage: string, otherUserName?: string, otherUserAvatar?: string) => {
    console.log('[updateConversation] Called for userId:', otherUserId, 'with message:', newMessage, 'userName:', otherUserName || 'not provided', 'timestamp:', new Date().toISOString());
    
    setConversations(prevConversations => {
      const now = new Date().toISOString();
      const existingConvIndex = prevConversations.findIndex(
        conv => conv.userId === otherUserId
      );

      if (otherUserName) {
        setUserCache(prev => ({
          ...prev,
          [otherUserId]: { name: otherUserName, avatar: otherUserAvatar }
        }));
      }

      let updatedConversations = [...prevConversations];
      
      if (existingConvIndex >= 0) {
        const existingConv = { ...updatedConversations[existingConvIndex] };
        updatedConversations.splice(existingConvIndex, 1);
        updatedConversations.unshift({
          ...existingConv,
          lastMessage: newMessage,
          timestamp: now,
          ...(otherUserName && { userName: otherUserName }),
          ...(otherUserAvatar && { userAvatar: otherUserAvatar })
        });
      } else if (otherUserName) {
        updatedConversations.unshift({
          userId: otherUserId,
          userName: otherUserName,
          userAvatar: otherUserAvatar,
          lastMessage: newMessage,
          timestamp: now
        });
      }

      return updatedConversations;
    });
  }, [setUserCache]);

  const fetchConversations = useCallback(async () => {
    try {
      if (!currentUser?.id) return;

      console.log('[fetchConversations] Fetching conversations for user:', currentUser.id);

      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, text, timestamp')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        console.log('[fetchConversations] No messages found');
        setConversations([]);
        return;
      }

      console.log('[fetchConversations] Found messages:', messages.length);
      
      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        uniqueUserIds.add(otherUserId);
      });

      console.log('[fetchConversations] Unique conversation partners:', Array.from(uniqueUserIds));
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', Array.from(uniqueUserIds));

      if (usersError) throw usersError;
      if (!users) return;

      const userMap = users.reduce((map: Record<string, any>, user) => {
        map[user.id] = user;
        return map;
      }, {});

      const conversationsMap = new Map<string, DMConversation>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const otherUser = userMap[otherUserId];
        
        if (otherUser && (!conversationsMap.has(otherUserId) || 
            new Date(msg.timestamp) > new Date(conversationsMap.get(otherUserId)?.timestamp || ''))) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUser.name,
            userAvatar: otherUser.avatar,
            lastMessage: msg.text,
            timestamp: msg.timestamp
          });
        }
      });

      const sortedConversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());

      console.log('[fetchConversations] Created conversations list:', sortedConversations.length);
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations",
        variant: "destructive"
      });
    }
  }, [currentUser?.id]);

  // Set up realtime subscriptions
  useRealtimeSubscriptions(currentUser?.id, userCache, fetchUserData, updateConversation);

  return { 
    conversations, 
    fetchConversations, 
    updateConversation, 
    refreshVersion 
  };
};
