
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SupportOptionsList, type SupportOption } from './support/SupportOptionsList';
import NewTicketDialog from '../chat/drawer/support/NewTicketDialog';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";

interface SupportPopoverProps {
  onCreateSupportChat?: (ticketId: string, subject: string, message: string) => void;
}

const SupportPopover: React.FC<SupportPopoverProps> = ({
  onCreateSupportChat
}) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SupportOption | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useApp();

  const handleOptionClick = (option: SupportOption) => {
    setSelectedOption(option);
    setMessage('');
    setOpen(false);
    setDialogOpen(true);
  };

  const handleTicketSubmit = async () => {
    if (!selectedOption) {
      toast({
        title: "Error",
        description: "No support topic selected.",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Make sure we have a valid user
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Creating support ticket with subject:", selectedOption.label);
      
      // Step 1: Create the ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedOption.label,
          user_id: currentUser.id,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) {
        throw ticketError;
      }

      console.log("Ticket created successfully:", ticketData);
      
      // Step 2: Create the initial message from the user
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        });

      if (messageError) {
        throw messageError;
      }

      console.log("User message created successfully");
      
      // Step 3: Create the auto-response
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          text: `Thank you for contacting support about "${selectedOption.label}". A support agent will review your request and respond shortly.`,
          sender_id: null,
          is_support: true
        });

      if (autoResponseError) {
        throw autoResponseError;
      }

      console.log("Auto-response created successfully");

      // Update local storage if needed
      const newTicket = {
        id: ticketData.id,
        subject: selectedOption.label,
        createdAt: new Date().toISOString(),
        status: 'open' as const,
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
      
      // Store in localStorage
      const storedTickets = localStorage.getItem('supportTickets');
      const ticketsArray = storedTickets ? JSON.parse(storedTickets) : [];
      ticketsArray.unshift(newTicket);
      localStorage.setItem('supportTickets', JSON.stringify(ticketsArray));
      
      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id } 
      }));

      if (onCreateSupportChat) {
        onCreateSupportChat(ticketData.id, selectedOption.label, message);
      }

      toast({
        title: "Support Request Sent",
        description: `Your ${selectedOption.label.toLowerCase()} request has been submitted. A support agent will get back to you soon.`,
      });

      setDialogOpen(false);
      setMessage('');
      setSelectedOption(null);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
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
        onSubmit={handleTicketSubmit}
        supportMessage={message}
        setSupportMessage={setMessage}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default SupportPopover;
