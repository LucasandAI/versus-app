
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
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b p-3">
        <h3 className="font-medium">{ticket.subject}</h3>
        <p className="text-xs text-gray-500">
          Created {new Date(ticket.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <ChatMessages 
        messages={ticket.messages || []} 
        clubMembers={currentUser ? [currentUser] : []}
        isSupport={true}
      />
      
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatTicketContent;
