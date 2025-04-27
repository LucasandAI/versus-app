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
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { currentUser } = useApp();

  const updateConversation = useCallback((otherUserId: string, newMessage: string, otherUserName?: string, otherUserAvatar?: string) => {
    setConversations(prevConversations => {
      const now = new Date().toISOString();
      const existingConversationIndex = prevConversations.findIndex(
        conv => conv.userId === otherUserId
      );

      let updatedConversations = [...prevConversations];
      
      if (existingConversationIndex >= 0) {
        // Move existing conversation to top and update
        const existingConv = { ...updatedConversations[existingConversationIndex] };
        updatedConversations.splice(existingConversationIndex, 1);
        updatedConversations.unshift({
          ...existingConv,
          lastMessage: newMessage,
          timestamp: now,
          ...(otherUserName && { userName: otherUserName }),
          ...(otherUserAvatar && { userAvatar: otherUserAvatar })
        });
      } else if (otherUserName) {
        // Add new conversation at the top
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
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      if (!currentUser?.id) return;

      console.log('[useConversations] Fetching conversations...');

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

      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        uniqueUserIds.add(otherUserId);
      });

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

  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('[useConversations] Setting up real-time subscription');
    
    const outgoingChannel = supabase
      .channel('dm-outgoing')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload: any) => {
          console.log('[useConversations] Outgoing DM detected:', payload);
          updateConversation(payload.new.receiver_id, payload.new.text);
        }
      )
      .subscribe();
    
    const incomingChannel = supabase
      .channel('dm-incoming')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        async (payload: any) => {
          console.log('[useConversations] Incoming DM detected:', payload);
          const { data: senderData } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', payload.new.sender_id)
            .single();
            
          updateConversation(
            payload.new.sender_id, 
            payload.new.text,
            senderData?.name,
            senderData?.avatar
          );
        }
      )
      .subscribe();

    fetchConversations();

    return () => {
      supabase.removeChannel(outgoingChannel);
      supabase.removeChannel(incomingChannel);
    };
  }, [currentUser?.id, fetchConversations, updateConversation]);

  return { 
    conversations, 
    fetchConversations, 
    updateConversation, 
    refreshVersion 
  };
};
