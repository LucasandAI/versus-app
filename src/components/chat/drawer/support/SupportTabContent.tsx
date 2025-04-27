import React from 'react';
import { SupportTicket } from '@/types/chat';
import { ArrowLeft } from 'lucide-react';
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

  const handleTicketClosed = () => {
    onSelectTicket(null as any);
  };

  const handleSubmitTicket = async () => {
    await handleSubmitSupportTicket();
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {!selectedTicket ? (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-4xl font-bold">Support</h1>
          </div>
          <div className="flex-1">
            <SupportTicketList
              supportTickets={supportTickets}
              onSelectTicket={onSelectTicket}
              selectedTicketId={selectedTicket?.id}
              isSubmitting={isSubmitting}
              onCreateTicket={(e) => setSupportOptionsOpen(true)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center border-b p-3 gap-3">
            <button 
              onClick={handleTicketClosed} 
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-semibold text-lg">{selectedTicket.subject}</h2>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatTicketContent 
              ticket={selectedTicket} 
              onSendMessage={onSendMessage}
              onTicketClosed={handleTicketClosed} 
            />
          </div>
        </div>
      )}

      <SupportOptions 
        open={supportOptionsOpen}
        onOpenChange={setSupportOptionsOpen}
        onSelectOption={(option) => {
          setSelectedSupportOption(option);
          setSupportOptionsOpen(false);
          setDialogOpen(true);
        }}
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
