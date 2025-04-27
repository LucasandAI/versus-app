
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { DMConversation } from './types';

export const useFetchConversations = (currentUserId: string | undefined) => {
  const fetchConversations = useCallback(async () => {
    try {
      if (!currentUserId) return [];

      console.log('[fetchConversations] Fetching conversations for user:', currentUserId);

      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, text, timestamp')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        console.log('[fetchConversations] No messages found');
        return [];
      }

      console.log('[fetchConversations] Found messages:', messages.length);
      
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

      const sortedConversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());

      console.log('[fetchConversations] Created conversations list:', sortedConversations.length);
      
      return sortedConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations",
        variant: "destructive"
      });
      return [];
    }
  }, [currentUserId]);

  return fetchConversations;
};
