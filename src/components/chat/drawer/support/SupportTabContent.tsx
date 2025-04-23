import React from 'react';
import { SupportTicket } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import SupportOptions from './SupportOptions';
import NewTicketDialog from './NewTicketDialog';
import ChatTicketContent from '../../ChatTicketContent';

interface SupportTabContentProps {
  supportTickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  handleSubmitSupportTicket: () => void;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  selectedTicket: SupportTicket | null;
  onSendMessage: (message: string) => void;
}

const SupportTabContent: React.FC<SupportTabContentProps> = ({
  supportTickets,
  onSelectTicket,
  handleSubmitSupportTicket,
  supportMessage,
  setSupportMessage,
  selectedTicket,
  onSendMessage
}) => {
  const [supportOptionsOpen, setSupportOptionsOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedSupportOption, setSelectedSupportOption] = React.useState<{id: string, label: string} | null>(null);

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

  if (selectedTicket) {
    return (
      <ChatTicketContent 
        ticket={selectedTicket} 
        onSendMessage={onSendMessage} 
      />
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Support Tickets</h2>
        <button 
          className="bg-primary text-white px-4 py-2 rounded-md text-sm"
          onClick={handleOpenSupportOptions}
        >
          New Ticket
        </button>
      </div>
      
      {supportTickets && supportTickets.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">
          No support tickets yet. Click "New Ticket" to create one.
        </div>
      ) : (
        <ul className="space-y-2">
          {supportTickets.map((ticket) => (
            <li 
              key={ticket.id} 
              onClick={() => onSelectTicket(ticket)}
              className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="font-medium">{ticket.subject}</div>
              <div className="text-xs text-gray-500">
                Created: {new Date(ticket.createdAt).toLocaleDateString()} 
                • {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-blue-500 mt-1">Click to view conversation</div>
            </li>
          ))}
        </ul>
      )}

      <SupportOptions 
        open={supportOptionsOpen}
        onOpenChange={setSupportOptionsOpen}
        onSelectOption={handleSelectSupportOption}
      />

      <NewTicketDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedOption={selectedSupportOption}
        onSubmit={handleSubmitSupportTicket}
        supportMessage={supportMessage}
        setSupportMessage={setSupportMessage}
      />
    </div>
  );
};

export default SupportTabContent;
