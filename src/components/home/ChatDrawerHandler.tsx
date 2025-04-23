
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
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
  const { isOpen, close } = useChatDrawerGlobal();
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchClubMessages = async () => {
      try {
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
          
          // Convert Supabase data shape to ChatMessage shape
          // message -> text
          const messages = (data || []).map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: {
              id: msg.sender_id,
              name: "", // Name and avatar would require extra join (out of scope here)
              avatar: ""
            },
            timestamp: msg.timestamp,
          }));
          
          return [club.id, messages];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
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
  }, [isOpen, userClubs]);

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      supportTickets={supportTickets}
      clubMessages={clubMessages}
      onNewMessage={setUnreadMessages}
    />
  );
};

export default ChatDrawerHandler;
