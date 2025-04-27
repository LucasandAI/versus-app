
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';
import { SupportOptionsList, type SupportOption } from './support/SupportOptionsList';
import NewTicketDialog from '../chat/drawer/support/NewTicketDialog';

interface SupportPopoverProps {
  onCreateSupportChat?: (ticketId: string, subject: string, message: string) => void;
}

const SupportPopover: React.FC<SupportPopoverProps> = ({
  onCreateSupportChat
}) => {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SupportOption | null>(null);
  const [message, setMessage] = useState('');

  const handleOptionClick = (option: SupportOption) => {
    setSelectedOption(option);
    setOpen(false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }

    createSupportChat(selectedOption!, message);
    
    toast({
      title: "Support Request Sent",
      description: `Your ${selectedOption?.label.toLowerCase()} has been submitted. A support agent will get back to you soon.`,
    });
    
    setDialogOpen(false);
    setMessage('');
  };

  const createSupportChat = (option: SupportOption, messageContent: string) => {
    const ticketId = 'support-' + Date.now();
    const subject = option.label;
    
    console.log('Support request created:', {
      type: option.id,
      label: option.label,
      message: messageContent,
      user: currentUser?.id || 'guest',
      timestamp: new Date().toISOString()
    });
    
    const newTicket = {
      id: ticketId,
      subject: subject,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          text: messageContent,
          sender: {
            id: currentUser?.id || 'anonymous',
            name: currentUser?.name || 'Anonymous',
            avatar: currentUser?.avatar || '/placeholder.svg',
          },
          timestamp: new Date().toISOString(),
          isSupport: false
        },
        {
          id: 'support-auto-' + Date.now(),
          text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
          sender: {
            id: 'support',
            name: 'Support Team',
            avatar: '/placeholder.svg'
          },
          timestamp: new Date(Date.now() + 1000).toISOString(),
          isSupport: true
        }
      ]
    };
    
    const existingTickets = localStorage.getItem('supportTickets');
    const tickets = existingTickets ? JSON.parse(existingTickets) : [];
    tickets.push(newTicket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));
    
    const unreadMessages = localStorage.getItem('unreadMessages');
    const unreadMap = unreadMessages ? JSON.parse(unreadMessages) : {};
    unreadMap[ticketId] = 1;
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMap));
    
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId, count: 1 }
    }));
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    if (onCreateSupportChat) {
      onCreateSupportChat(ticketId, subject, messageContent);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 fixed bottom-20 right-4 text-gray-500 hover:bg-gray-100 rounded-full lg:bottom-6"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Support</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <SupportOptionsList onOptionClick={handleOptionClick} />
        </PopoverContent>
      </Popover>

      <NewTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedOption={selectedOption}
        onSubmit={handleSubmit}
        supportMessage={message}
        setSupportMessage={setMessage}
      />
    </>
  );
};

export default SupportPopover;
