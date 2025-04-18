
import React, { useState } from 'react';
import { HelpCircle, MessageSquare, AlertCircle, Flag } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useApp } from '@/context/AppContext';

interface SupportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const supportOptions: SupportOption[] = [
  {
    id: 'contact',
    label: 'Contact Support',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Get help with a general question or issue'
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Tell us if something isn't working correctly"
  },
  {
    id: 'report',
    label: 'Report a Cheater',
    icon: <Flag className="h-4 w-4" />,
    description: 'Report suspicious activities or cheating'
  }
];

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

    // Create a support chat
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
    
    // Prepare ticket for storage
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
    
    // Store the ticket in localStorage whether or not the callback exists
    const existingTickets = localStorage.getItem('supportTickets');
    const tickets = existingTickets ? JSON.parse(existingTickets) : [];
    tickets.push(newTicket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));
    
    // If the callback exists, use it to create a support chat
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
          <div className="p-2">
            {supportOptions.map((option) => (
              <button
                key={option.id}
                className="w-full text-left flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md"
                onClick={() => handleOptionClick(option)}
              >
                <span className="flex-shrink-0 text-gray-500">{option.icon}</span>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedOption?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide details about your {selectedOption?.label.toLowerCase()}.
              Our team will review your submission and open a support chat to assist you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <textarea 
              className="w-full min-h-[100px] p-2 border rounded-md" 
              placeholder={`Describe your ${selectedOption?.label.toLowerCase()} in detail...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessage('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SupportPopover;
