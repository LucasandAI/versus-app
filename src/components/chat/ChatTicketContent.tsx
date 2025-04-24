import React from 'react';
import { SupportTicket } from '@/types/chat';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useApp } from '@/context/AppContext';

interface ChatTicketContentProps {
  ticket: SupportTicket;
  onSendMessage: (message: string) => void;
}

const ChatTicketContent = ({ ticket, onSendMessage }: ChatTicketContentProps) => {
  const { currentUser } = useApp();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages 
          messages={ticket.messages || []} 
          clubMembers={currentUser ? [currentUser] : []}
          isSupport={true}
        />
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default ChatTicketContent;
