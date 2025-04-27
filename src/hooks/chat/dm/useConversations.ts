
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

export interface DMConversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  timestamp?: string;
}

export const useConversations = (hiddenDMs: string[]) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const { currentUser } = useApp();

  const fetchConversations = useCallback(async () => {
    try {
      if (!currentUser?.id) return;

      console.log('[useConversations] Fetching conversations...');

      // Fetch messages with a more efficient query
      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, text, timestamp')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        setConversations([]);
        return;
      }

      // Get unique user IDs from conversations
      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        uniqueUserIds.add(otherUserId);
      });

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', Array.from(uniqueUserIds));

      if (usersError) throw usersError;
      if (!users) return;

      // Create a map for quick user lookup
      const userMap = users.reduce((map: Record<string, any>, user) => {
        map[user.id] = user;
        return map;
      }, {});

      // Process messages into conversations with latest message first
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

      // Sort conversations by timestamp
      const sortedConversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());

      // Force a complete state update to trigger a re-render
      setConversations([...sortedConversations]);
      console.log('[useConversations] Updated conversations:', sortedConversations.length);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Could not load conversations",
        variant: "destructive"
      });
    }
  }, [currentUser?.id]);

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('[useConversations] Setting up real-time subscription');
    
    // Create a channel for outgoing messages (sent by current user)
    const outgoingChannel = supabase
      .channel('dm-outgoing')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useConversations] Outgoing DM detected, refreshing conversations');
          fetchConversations();
        }
      )
      .subscribe();
    
    // Create a channel for incoming messages (received by current user)
    const incomingChannel = supabase
      .channel('dm-incoming')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useConversations] Incoming DM detected, refreshing conversations');
          fetchConversations();
        }
      )
      .subscribe();

    fetchConversations();

    return () => {
      supabase.removeChannel(outgoingChannel);
      supabase.removeChannel(incomingChannel);
    };
  }, [currentUser?.id, fetchConversations]);

  return { conversations, fetchConversations };
};
