
import { useState, useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';
import { toast } from '@/hooks/use-toast';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const pageSize = 50;
  
  // Function to format messages with sender details
  const formatMessagesWithSender = useCallback(async (messages: any[]) => {
    if (!messages.length) return [];
    
    try {
      // Get unique sender IDs from messages
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      
      if (!senderIds.length) return messages;
      
      // Fetch sender details
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', senderIds);
        
      const userMap = (users || []).reduce((map: Record<string, any>, user) => {
        map[user.id] = user;
        return map;
      }, {});
      
      // Map messages with sender details
      return messages.map(message => ({
        id: message.id,
        text: message.message, // Map message content to text field
        club_id: message.club_id,
        timestamp: message.timestamp,
        sender: userMap[message.sender_id] || {
          id: message.sender_id,
          name: 'Unknown User'
        }
      }));
    } catch (error) {
      console.error('Error formatting messages with sender:', error);
      return messages;
    }
  }, []);
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        
        // Set loading state for all clubs
        const loadingState: Record<string, boolean> = {};
        clubIds.forEach(id => {
          loadingState[id] = true;
        });
        setIsLoading(loadingState);
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message, 
            sender_id, 
            club_id, 
            timestamp
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(pageSize);
          
        if (error) throw error;
        
        if (data) {
          const messagesMap: Record<string, any[]> = {};
          const hasMoreMap: Record<string, boolean> = {};
          
          // Group messages by club_id
          for (const clubId of clubIds) {
            const clubMessages = data.filter(msg => msg.club_id === clubId);
            
            // Format messages with sender details
            const formattedMessages = await formatMessagesWithSender(clubMessages);
            
            // Sort messages by timestamp (oldest first)
            messagesMap[clubId] = formattedMessages.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            // If we got exactly pageSize messages, assume there might be more
            hasMoreMap[clubId] = clubMessages.length === pageSize;
          }
          
          setClubMessages(messagesMap);
          setHasMore(hasMoreMap);
        }
        
        // Clear loading states
        const notLoadingState: Record<string, boolean> = {};
        clubIds.forEach(id => {
          notLoadingState[id] = false;
        });
        setIsLoading(notLoadingState);
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
        // Clear loading states on error
        const notLoadingState: Record<string, boolean> = {};
        userClubs.forEach(club => {
          notLoadingState[club.id] = false;
        });
        setIsLoading(notLoadingState);
        
        toast({
          title: "Error",
          description: "Failed to load club messages",
          variant: "destructive"
        });
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs, formatMessagesWithSender]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  // Function to load older messages for a specific club
  const loadOlderMessages = async (clubId: string) => {
    if (!currentUser?.id || !clubId || !clubMessages[clubId]?.length) return;
    
    try {
      setIsLoading(prev => ({ ...prev, [clubId]: true }));
      
      // Get the timestamp of the oldest message we have
      const oldestMessage = [...clubMessages[clubId]].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];
      
      if (!oldestMessage) {
        setHasMore(prev => ({ ...prev, [clubId]: false }));
        setIsLoading(prev => ({ ...prev, [clubId]: false }));
        return;
      }
      
      const { data, error } = await supabase
        .from('club_chat_messages')
        .select(`
          id, 
          message, 
          sender_id, 
          club_id, 
          timestamp
        `)
        .eq('club_id', clubId)
        .lt('timestamp', oldestMessage.timestamp) // Get messages older than our oldest
        .order('timestamp', { ascending: false })
        .limit(pageSize);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Format messages with sender details
        const formattedMessages = await formatMessagesWithSender(data);
        
        // Sort the newly fetched messages (oldest first)
        const olderMessages = formattedMessages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Add older messages to the beginning of the current messages array
        setClubMessages(prev => ({
          ...prev,
          [clubId]: [...olderMessages, ...prev[clubId]]
        }));
        
        // If we got less than pageSize messages, assume there are no more
        setHasMore(prev => ({ ...prev, [clubId]: data.length === pageSize }));
      } else {
        // No older messages found
        setHasMore(prev => ({ ...prev, [clubId]: false }));
      }
      
      setIsLoading(prev => ({ ...prev, [clubId]: false }));
    } catch (error) {
      console.error('[useClubMessages] Error fetching older messages:', error);
      setIsLoading(prev => ({ ...prev, [clubId]: false }));
      
      toast({
        title: "Error",
        description: "Failed to load older messages",
        variant: "destructive"
      });
    }
  };
  
  return {
    clubMessages,
    setClubMessages,
    isLoading,
    hasMore,
    loadOlderMessages
  };
};
