
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
import { useApp } from '@/context/AppContext';
import { useSupportTicketStorage } from '@/hooks/chat/support/useSupportTicketStorage';

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
  const { createTicketInSupabase } = useSupportTicketStorage();

  const handleOptionClick = (option: SupportOption) => {
    setSelectedOption(option);
    setMessage('');
    setOpen(false);
    setDialogOpen(true);
  };

  const handleTicketSubmit = async (submittedMessage: string) => {
    console.log('[SupportPopover] Starting ticket submission process...');
    
    if (!selectedOption || !currentUser?.id) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newTicket = await createTicketInSupabase(selectedOption.label, submittedMessage);
      
      if (newTicket) {
        // Success - trigger callback to open the newly created chat
        if (onCreateSupportChat) {
          console.log('[SupportPopover] Opening new chat with ticket:', newTicket.id);
          onCreateSupportChat(newTicket.id, selectedOption.label, submittedMessage);
        }
      }
      
      // Reset state and close dialog
      setDialogOpen(false);
      setMessage('');
      setSelectedOption(null);
      
    } catch (error) {
      console.error('[SupportPopover] Error in ticket submission:', error);
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
