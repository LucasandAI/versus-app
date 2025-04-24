
import React from 'react';
import { SupportTicket } from '@/types/chat';
import { HelpCircle, Trash2, XCircle } from 'lucide-react';

interface SupportTicketsListProps {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  onSelectTicket: (ticket: SupportTicket) => void;
  onDeleteChat?: (chatId: string, isTicket: boolean) => void;
  unreadCounts: Record<string, number>;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket: boolean;
  } | null) => void;
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

  // Handler for selecting a ticket with logging
  const handleSelectTicket = (ticket: SupportTicket) => {
    console.log('[SupportTicketsList] Selecting ticket:', ticket.id, 
      'Current selection:', selectedTicket?.id);
    onSelectTicket(ticket);
  };

  return (
    <div className="space-y-1 mt-4">
      <div className="px-3 py-2">
        <h3 className="text-sm font-medium text-gray-500">Support Tickets</h3>
      </div>
      
      <ul>
        {tickets.map(ticket => {
          const isSelected = selectedTicket && ticket.id === selectedTicket.id;
          const unreadCount = unreadCounts[ticket.id] || 0;
          
          return (
            <li 
              key={ticket.id} 
              className={`relative group px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                isSelected ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSelectTicket(ticket)}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">{ticket.subject}</span>
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {onDeleteChat && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete({
                        id: ticket.id,
                        name: ticket.subject,
                        isTicket: true
                      });
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    aria-label="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SupportTicketsList;
