
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

  const handleTicketSubmit = async (submittedMessage: string) => {
    console.log('[SupportPopover] Starting ticket submission process...');
    console.log('[SupportPopover] Current user:', currentUser?.id);
    console.log('[SupportPopover] Selected option:', selectedOption?.label);

    if (!selectedOption) {
      toast({
        title: "Error",
        description: "No support topic selected.",
        variant: "destructive"
      });
      return;
    }

    // Make sure we have a valid user
    if (!currentUser?.id) {
      console.error('[SupportPopover] No current user found');
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('[SupportPopover] Attempting to insert into support_tickets...');
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

      console.log('[SupportPopover] Ticket creation result:', { ticketData, ticketError });

      if (ticketError) {
        console.error('[SupportPopover] Failed to create ticket:', ticketError);
        throw new Error('Failed to create support ticket');
      }

      if (!ticketData) {
        console.error('[SupportPopover] No ticket data returned');
        throw new Error('No ticket data returned');
      }

      console.log('[SupportPopover] Attempting to insert initial message...');
      // Step 2: Create the initial message
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: submittedMessage,
          is_support: false
        });

      console.log('[SupportPopover] Message creation result:', { messageData, messageError });

      if (messageError) {
        console.error('[SupportPopover] Failed to create message:', messageError);
        throw new Error('Failed to create support message');
      }

      console.log('[SupportPopover] Attempting to insert auto-response...');
      // Step 3: Create auto-response
      const { data: autoResponseData, error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          text: `Thank you for contacting support about "${selectedOption.label}". A support agent will review your request and respond shortly.`,
          sender_id: null,
          is_support: true
        });

      console.log('[SupportPopover] Auto-response creation result:', { autoResponseData, autoResponseError });

      if (autoResponseError) {
        console.error('[SupportPopover] Failed to create auto-response:', autoResponseError);
        throw new Error('Failed to create auto-response');
      }

      // Success - show toast and trigger callbacks
      toast({
        title: "Support Request Sent",
        description: `Your ${selectedOption.label.toLowerCase()} request has been submitted. A support agent will get back to you soon.`,
      });

      // Open the newly created chat if callback provided
      if (onCreateSupportChat) {
        console.log('[SupportPopover] Opening new chat with ticket:', ticketData.id);
        onCreateSupportChat(ticketData.id, selectedOption.label, submittedMessage);
      }

      // Reset state and close dialog
      setDialogOpen(false);
      setMessage('');
      setSelectedOption(null);
      
    } catch (error) {
      console.error('[SupportPopover] Error in ticket submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create support ticket. Please try again.",
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
