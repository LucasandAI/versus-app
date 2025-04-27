
import React, { useState, useRef } from 'react';
import { SupportTicket } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useSupportTicketStorage } from '@/hooks/chat/support/useSupportTicketStorage';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ChatTicketContentProps {
  ticket: SupportTicket;
  onSendMessage: (message: string) => void;
  onTicketClosed: () => void;
}

const ChatTicketContent: React.FC<ChatTicketContentProps> = ({
  ticket,
  onSendMessage,
  onTicketClosed
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const { deleteTicketFromSupabase } = useSupportTicketStorage();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await onSendMessage(message);
      setMessage('');
      
      // Scroll to the new message
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseTicket = async () => {
    setIsClosing(true);
    try {
      // Delete ticket from database
      await deleteTicketFromSupabase(ticket.id);
      toast({
        title: "Ticket Closed",
        description: "Support ticket has been closed successfully."
      });
      onTicketClosed();
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast({
        title: "Error",
        description: "Failed to close the support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClosing(false);
    }
  };

  const formatTimeCustom = (isoString: string) => {
    try {
      return format(new Date(isoString), 'MMM d, h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Check if there are messages to display
  if (!ticket.messages || ticket.messages.length === 0) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No messages in this ticket.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto relative">
        <ChatMessages 
          messages={ticket.messages}
          isSupport={true}
          lastMessageRef={lastMessageRef}
          formatTime={formatTimeCustom}
        />
        
        <div className="sticky bottom-4 right-4 flex justify-end px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full shadow-md"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex justify-between mb-2">
          <p className="text-xs text-gray-500">
            Ticket created: {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCloseTicket}
            disabled={isClosing}
          >
            {isClosing ? "Closing..." : "Close Ticket"}
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <ChatInput
            value={message}
            onChange={setMessage}
            placeholder="Type your reply..."
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatTicketContent;
