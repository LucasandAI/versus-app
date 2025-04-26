
import React from 'react';
import { SupportTicket } from '@/types/chat';
import SupportOptions from './SupportOptions';
import NewTicketDialog from './NewTicketDialog';
import ChatTicketContent from '../../ChatTicketContent';
import SupportTicketList from './SupportTicketList';

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

  // Debug log for ticket selection
  React.useEffect(() => {
    console.log('[SupportTabContent] selectedTicket changed:', selectedTicket?.id);
  }, [selectedTicket]);

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

  const handleTicketClosed = () => {
    onSelectTicket(null as any);
  };

  const handleSubmitTicket = async () => {
    await handleSubmitSupportTicket();
    setDialogOpen(false);
  };

  // Handler for selecting a ticket from the list
  const handleSelectTicket = (ticket: SupportTicket) => {
    console.log('[SupportTabContent] Selecting ticket:', ticket.id);
    onSelectTicket(ticket);
  };

  return (
    <div className="flex h-full w-full">
      <SupportTicketList
        supportTickets={supportTickets}
        onSelectTicket={handleSelectTicket}
        selectedTicketId={selectedTicket?.id}
        isSubmitting={isSubmitting}
        onCreateTicket={handleOpenSupportOptions}
      />
      
      <div className="flex-1 h-full">
        {selectedTicket ? (
          <div className="flex flex-col h-full">
            <ChatTicketContent 
              key={selectedTicket.id} // Force re-render when ticket changes
              ticket={selectedTicket} 
              onSendMessage={onSendMessage}
              onTicketClosed={handleTicketClosed} 
            />
          </div>
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
