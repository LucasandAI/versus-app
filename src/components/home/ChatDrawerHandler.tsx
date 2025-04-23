
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawerMessages } from '@/hooks/chat/useChatDrawerMessages';
import { useRealtimeMessages } from '@/hooks/chat/useRealtimeMessages';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useChatActions } from '@/hooks/chat/useChatActions';

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
  const { currentUser } = useApp();
  
  const { clubMessages, setClubMessages } = useChatDrawerMessages(userClubs, isOpen);
  const { sendMessageToClub } = useChatActions();
  
  // Pass setClubMessages to useRealtimeMessages
  useRealtimeMessages(isOpen, setClubMessages);

  const handleSendMessage = async (message: string, clubId?: string) => {
    if (!clubId || !message.trim()) return;
    
    console.log('[ChatDrawerHandler] Sending message to club:', { clubId });
    await sendMessageToClub(clubId, message);
  };

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
      onSendMessage={handleSendMessage}
    />
  );
};

export default ChatDrawerHandler;
