
import React from 'react';
import { SupportTicket } from '@/types/chat';
import { HelpCircle, Trash2 } from 'lucide-react';

interface SupportTicketsListProps {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  onSelectTicket: (ticket: SupportTicket) => void;
  onDeleteChat?: (chatId: string, isTicket: boolean) => void;
  unreadCounts: Record<string, number>;
  setChatToDelete: (data: {id: string, name: string, isTicket: boolean} | null) => void;
}

const SupportTicketsList: React.FC<SupportTicketsListProps> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  onDeleteChat,
  unreadCounts,
  setChatToDelete
}) => {
  if (!tickets.length) return null;

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Support Tickets</h3>
      
      <div className="space-y-1">
        {tickets.map((ticket) => (
          <div
            key={`ticket-${ticket.id}`}
            className="relative group"
          >
            <button
              className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                selectedTicket?.id === ticket.id 
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectTicket(ticket)}
            >
              <div className="flex-shrink-0 mr-2">
                <div className="bg-blue-100 text-blue-700 h-8 w-8 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  {unreadCounts[ticket.id] > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCounts[ticket.id] > 9 ? '9+' : unreadCounts[ticket.id]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
            {onDeleteChat && (
              <button 
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                onClick={() => setChatToDelete({
                  id: ticket.id,
                  name: ticket.subject,
                  isTicket: true
                })}
              >
                <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportTicketsList;
