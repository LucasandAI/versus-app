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
  return;
};
export default SupportTicketsList;