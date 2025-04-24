
import React from 'react';
import { SupportTicket } from '@/types/chat';
import { Loader2 } from 'lucide-react';

interface SupportTicketListProps {
  supportTickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  selectedTicketId?: string;
  isSubmitting?: boolean;
  onCreateTicket: (e: React.MouseEvent) => void;
}

const SupportTicketList: React.FC<SupportTicketListProps> = ({
  supportTickets,
  onSelectTicket,
  selectedTicketId,
  isSubmitting,
  onCreateTicket
}) => {
  return (
    <div className="w-[240px] border-r h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Support</h2>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center"
            onClick={onCreateTicket}
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
                  selectedTicketId === ticket.id ? 'bg-gray-100' : ''
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
  );
};

export default SupportTicketList;
