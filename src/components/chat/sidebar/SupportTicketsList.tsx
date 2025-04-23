import React from 'react';
import { SupportTicket } from '@/types/chat';
import { HelpCircle, Trash2 } from 'lucide-react';
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
  return <div className="space-y-1 mt-4">
      
      <ul>
        {tickets.map(ticket => {
        const isSelected = selectedTicket && ticket.id === selectedTicket.id;
        const unreadCount = unreadCounts[ticket.id] || 0;
        return <li key={ticket.id} className="relative">
              
              
              {onDeleteChat && <button onClick={() => setChatToDelete({
            id: ticket.id,
            name: ticket.subject,
            isTicket: true
          })} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded" aria-label="Delete ticket">
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>}
            </li>;
      })}
      </ul>
    </div>;
};
export default SupportTicketsList;