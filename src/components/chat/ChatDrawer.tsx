
import React from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import ChatDrawerHeader from './drawer/ChatDrawerHeader';
import ChatDrawerContent from './drawer/ChatDrawerContent';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
  clubMessages?: Record<string, any[]>;
}

const ChatDrawer = ({ 
  open, 
  onOpenChange, 
  clubs,
  onNewMessage,
  supportTickets = [],
  clubMessages = {}
}: ChatDrawerProps) => {
  const { currentUser } = useApp();
  
  const {
    selectedLocalClub,
    selectedTicket,
    localSupportTickets,
    handleSelectClub,
    handleSelectTicket,
  } = useChatDrawerState(open, supportTickets);

  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat
  } = useChat(open, onNewMessage);

  const handleSendClubMessage = async (message: string, clubId: string) => {
    if (!currentUser) return;
    
    try {
      // First, add message to the UI immediately for better UX
      const newMessage = {
        id: `temp-${Date.now()}`,
        text: message, // Changed from 'message' to 'text' to match ChatMessage type
        sender_id: currentUser.id,
        club_id: clubId,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        }
      };
      
      handleNewMessage(clubId, newMessage, open);
      
      // Then persist to Supabase
      const { data, error } = await supabase
        .from('club_chat_messages')
        .insert({
          message,
          club_id: clubId,
          sender_id: currentUser.id
        })
        .select();
        
      if (error) {
        console.error('Error sending club message:', error);
      }
    } catch (error) {
      console.error('Error in handleSendClubMessage:', error);
    }
  };

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0">
          <ChatDrawerHeader />
          <ChatDrawerContent 
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            selectedTicket={selectedTicket}
            localSupportTickets={localSupportTickets}
            onSelectClub={handleSelectClub}
            onSelectTicket={handleSelectTicket}
            refreshKey={refreshKey}
            messages={clubMessages || messages}
            deleteChat={deleteChat}
            unreadMessages={unreadMessages}
            handleNewMessage={handleNewMessage}
            markTicketAsRead={markTicketAsRead}
            onSendMessage={handleSendClubMessage}
          />
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default ChatDrawer;
