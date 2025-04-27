
import React, { useState, useRef, useEffect } from 'react';
import { SupportTicket } from '@/types/chat';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useApp } from '@/context/AppContext';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useChatDeletion } from '@/hooks/chat/useChatDeletion';
import { useSupportTicketStorage } from '@/hooks/chat/support/useSupportTicketStorage';

interface ChatTicketContentProps {
  ticket: SupportTicket;
  onSendMessage: (message: string) => void;
  onTicketClosed?: () => void;
}

const ChatTicketContent: React.FC<ChatTicketContentProps> = ({ ticket, onSendMessage, onTicketClosed }: ChatTicketContentProps) => {
  const { currentUser } = useApp();
  const { deleteChat } = useChatDeletion();
  const { sendMessageToTicket } = useSupportTicketStorage();
  const [localMessages, setLocalMessages] = useState(ticket.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    setLocalMessages(ticket.messages || []);
  }, [ticket.messages]);

  const handleSendMessage = async (message: string) => {
    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      text: message,
      sender: {
        id: currentUser?.id || 'unknown',
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '/placeholder.svg'
      },
      timestamp: new Date().toISOString(),
      isSupport: false
    };

    // Update local state immediately for optimistic UI
    setLocalMessages(prevMessages => [...prevMessages, optimisticMessage]);

    // Send message to database
    await sendMessageToTicket(ticket.id, message);
    
    // Call the parent handler
    onSendMessage(message);
  };

  const handleCloseTicket = () => {
    console.log('[ChatTicketContent] Starting ticket closure process for ticket:', ticket.id);
    
    // Delete ticket in the database and update UI
    deleteChat(ticket.id, true);
    
    // Close ticket view in the UI
    if (onTicketClosed) {
      onTicketClosed();
    }
    
    toast({
      title: "Ticket Deleted",
      description: "The support ticket has been successfully deleted.",
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b p-3 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{ticket.subject}</h3>
          <p className="text-xs text-gray-500">
            Created {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCloseTicket}
          className="text-gray-500 hover:text-gray-700"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Close Ticket
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-16">
        <ChatMessages 
          messages={localMessages} 
          clubMembers={currentUser ? [currentUser] : []}
          isSupport={true}
        />
        <div ref={messagesEndRef} />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t">
        <ChatInput 
          onSendMessage={handleSendMessage}
          conversationId={ticket.id}
          conversationType="support" 
        />
      </div>
    </div>
  );
};

export default ChatTicketContent;
