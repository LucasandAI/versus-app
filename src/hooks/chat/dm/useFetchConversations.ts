import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useConversationsPersistence } from './useConversationsPersistence';
import type { DMConversation } from './types';

export const useFetchConversations = (currentUserId: string | undefined) => {
  const { loadConversationsFromStorage } = useConversationsPersistence();

  const fetchConversations = useCallback(async () => {
    try {
      if (!currentUserId) return [];

      console.log('[fetchConversations] Fetching conversations for user:', currentUserId);

      // Load stored conversations first
      const storedConversations = loadConversationsFromStorage();
      console.log('[fetchConversations] Loaded stored conversations:', storedConversations.length);

      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, text, timestamp')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        console.log('[fetchConversations] No messages found in database');
        return storedConversations;
      }

      console.log('[fetchConversations] Found messages in database:', messages.length);
      
      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        uniqueUserIds.add(otherUserId);
      });

      console.log('[fetchConversations] Unique conversation partners:', Array.from(uniqueUserIds));
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', Array.from(uniqueUserIds));

      if (usersError) throw usersError;
      if (!users) return [];

      const userMap = users.reduce((map: Record<string, any>, user) => {
        map[user.id] = user;
        return map;
      }, {});

      const conversationsMap = new Map<string, DMConversation>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
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

      // Merge database conversations with stored ones, prioritizing newer timestamps
      const mergedConversations = Array.from(conversationsMap.values())
        .concat(storedConversations)
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
        // Remove duplicates based on userId
        .filter((conv, index, self) => 
          index === self.findIndex(c => c.userId === conv.userId)
        );

      console.log('[fetchConversations] Created merged conversations list:', mergedConversations.length);
      
      return mergedConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations",
        variant: "destructive"
      });
      return loadConversationsFromStorage(); // Fallback to stored conversations on error
    }
  }, [currentUserId, loadConversationsFromStorage]);

  return fetchConversations;
};
