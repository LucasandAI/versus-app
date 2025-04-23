
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawer } from '@/hooks/home/useChatDrawer';
import { supabase } from '@/integrations/supabase/client';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
  supportTickets: SupportTicket[];
  setUnreadMessages: (count: number) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser,
  supportTickets,
  setUnreadMessages
}) => {
  const { chatDrawerOpen, setChatDrawerOpen, closeChatDrawer } = useChatDrawer();
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  
  // Fetch club messages when drawer opens
  useEffect(() => {
    if (!chatDrawerOpen) return;
    
    const fetchClubMessages = async () => {
      try {
        // For each club, fetch messages
        const messagesPromises = userClubs.map(async (club) => {
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select('id, message, timestamp, sender_id, club_id')
            .eq('club_id', club.id)
            .order('timestamp', { ascending: true });
            
          if (error) {
            console.error(`Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          // Ensure we always return an array, even if data is null or undefined
          return [club.id, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
          // Ensure that clubId is a string and messages is always an array
          if (typeof clubId === 'string') {
            clubMessagesMap[clubId] = Array.isArray(messages) ? messages : [];
          }
        });
        
        setClubMessages(clubMessagesMap);
      } catch (error) {
        console.error('Error fetching club messages:', error);
      }
    };
    
    fetchClubMessages();
  }, [chatDrawerOpen, userClubs]);

  return (
    <ChatDrawer 
      open={chatDrawerOpen} 
      onOpenChange={(open) => {
        setChatDrawerOpen(open);
        if (!open) {
          closeChatDrawer();
        }
      }} 
      clubs={userClubs}
      onNewMessage={(count) => setUnreadMessages(count)} 
      supportTickets={supportTickets}
      clubMessages={clubMessages}
    />
  );
};

export default ChatDrawerHandler;
