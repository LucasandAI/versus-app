
import React, { useEffect } from 'react';
import { SupportTicket } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import SupportOptions from './SupportOptions';
import NewTicketDialog from './NewTicketDialog';
import ChatTicketContent from '../../ChatTicketContent';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface SupportTabContentProps {
  supportTickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  handleSubmitSupportTicket: () => Promise<void>;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  selectedTicket: SupportTicket | null;
  onSendMessage: (message: string) => void;
  isSubmitting?: boolean;
  selectedSupportOption: {id: string, label: string} | null;
  setSelectedSupportOption: (option: {id: string, label: string} | null) => void;
  activeTab: "clubs" | "dm" | "support";
}

const SupportTabContent: React.FC<SupportTabContentProps> = ({
  supportTickets,
  onSelectTicket,
  handleSubmitSupportTicket,
  supportMessage,
  setSupportMessage,
  selectedTicket,
  onSendMessage,
  isSubmitting = false,
  selectedSupportOption,
  setSelectedSupportOption,
  activeTab
}) => {
  const [supportOptionsOpen, setSupportOptionsOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleOpenSupportOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSupportOptionsOpen(true);
  };

  const handleSelectSupportOption = (option: {id: string, label: string}) => {
    setSelectedSupportOption(option);
    setSupportOptionsOpen(false);
    setDialogOpen(true);
  };

  const handleBackToTicketList = () => {
    onSelectTicket(null as any);
  };

  const handleTicketClosed = () => {
    onSelectTicket(null as any);
  };

  const handleSubmitTicket = async () => {
    if (!selectedSupportOption) {
      toast({
        title: "Support Option Required",
        description: "Please select a support option before submitting",
        variant: "destructive"
      });
      return;
    }
    
    if (!supportMessage || supportMessage.trim() === '') {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting",
        variant: "destructive"
      });
      return;
    }

    await handleSubmitSupportTicket();
    setDialogOpen(false);
  };

  return (
    <div className="flex h-full w-full">
      <div className="w-[240px] border-r">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Support</h2>
            <button 
              className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center"
              onClick={handleOpenSupportOptions}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'New Ticket'
              )}
            </button>
          </div>
          
          {supportTickets.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center">
              No support tickets yet. Click "New Ticket" to create one.
            </div>
          ) : (
            <ul className="space-y-2">
              {supportTickets.map((ticket) => (
                <li 
                  key={ticket.id} 
                  onClick={() => onSelectTicket(ticket)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition ${
                    selectedTicket?.id === ticket.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-medium">{ticket.subject}</div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()} 
                    • {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        {selectedTicket ? (
          <ChatTicketContent 
            ticket={selectedTicket} 
            onSendMessage={onSendMessage}
            onTicketClosed={handleTicketClosed} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a ticket or create a new one to get started
          </div>
        )}
      </div>

      <SupportOptions 
        open={supportOptionsOpen}
        onOpenChange={setSupportOptionsOpen}
        onSelectOption={handleSelectSupportOption}
      />

      <NewTicketDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedOption={selectedSupportOption}
        onSubmit={handleSubmitTicket}
        supportMessage={supportMessage}
        setSupportMessage={setSupportMessage}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SupportTabContent;
