
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
import { supabase } from '@/integrations/supabase/client';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionClick = (option: SupportOption) => {
    setSelectedOption(option);
    setMessage(''); // Reset message when selecting a new option
    setOpen(false);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedOption) {
      // This shouldn't happen as we only open the dialog when an option is selected,
      // but as a safeguard:
      console.error('Attempting to submit without a selected option');
      return;
    }

    setIsSubmitting(true);
    
    console.log('[Submitting Support Ticket]', {
      subject: selectedOption.label,
      message: message
    });
    
    try {
      // Create the support ticket in Supabase
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedOption.label,
          user_id: currentUser?.id || 'anonymous',
          status: 'open'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting support ticket:', error);
        throw new Error(`Failed to create ticket: ${error.message}`);
      }
      
      // Now add the first message to this ticket
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: data.id,
          text: message,
          sender_id: currentUser?.id,
          is_support: false
        });
      
      if (messageError) {
        console.error('Error inserting support message:', messageError);
        throw new Error(`Failed to create message: ${messageError.message}`);
      }
      
      // Add auto-response from support
      await supabase
        .from('support_messages')
        .insert({
          ticket_id: data.id,
          text: `Thank you for contacting support about "${selectedOption.label}". A support agent will review your request and respond shortly.`,
          sender_id: null,
          is_support: true
        });
      
      // For backwards compatibility with localStorage implementation
      const newTicket = {
        id: data.id,
        subject: selectedOption.label,
        createdAt: new Date().toISOString(),
        status: 'open',
        messages: [
          {
            id: Date.now().toString(),
            text: message,
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
            text: `Thank you for contacting support about "${selectedOption.label}". A support agent will review your request and respond shortly.`,
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
      
      // Save to localStorage for compatibility with existing code
      const existingTickets = localStorage.getItem('supportTickets');
      const tickets = existingTickets ? JSON.parse(existingTickets) : [];
      tickets.unshift(newTicket); // Add to beginning of array
      localStorage.setItem('supportTickets', JSON.stringify(tickets));
      
      // Update unread messages
      const unreadMessages = localStorage.getItem('unreadMessages');
      const unreadMap = unreadMessages ? JSON.parse(unreadMessages) : {};
      unreadMap[data.id] = 1;
      localStorage.setItem('unreadMessages', JSON.stringify(unreadMap));
      
      // Dispatch events to update UI
      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: data.id, count: 1 }
      }));
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      
      // If callback exists, call it
      if (onCreateSupportChat) {
        onCreateSupportChat(data.id, selectedOption.label, message);
      }
      
      toast({
        title: "Support Request Sent",
        description: `Your ${selectedOption.label.toLowerCase()} request has been submitted. A support agent will get back to you soon.`,
      });
      
      // Reset states
      setDialogOpen(false);
      setMessage('');
      setSelectedOption(null);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
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
        onOpenChange={(value) => {
          if (!value && !isSubmitting) {
            setDialogOpen(false);
          }
        }}
        selectedOption={selectedOption}
        onSubmit={handleSubmit}
        supportMessage={message}
        setSupportMessage={setMessage}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default SupportPopover;
