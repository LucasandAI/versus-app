
import React, { useState } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
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
import SupportTicketsList from './sidebar/SupportTicketsList';
import ClubsList from './sidebar/ClubsList';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  supportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  onDeleteChat?: (chatId: string, isTicket?: boolean) => void;
  unreadCounts?: Record<string, number>;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void; // Made optional with ?
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  clubs, 
  selectedClub, 
  selectedTicket,
  supportTickets,
  onSelectClub,
  onSelectTicket,
  onDeleteChat,
  unreadCounts = {},
  onSelectUser
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [chatToDelete, setChatToDelete] = useState<{id: string, name: string, isTicket: boolean} | null>(null);

  const handleDeleteChat = () => {
    // Only allow deletion if it's a support ticket, not a club
    if (chatToDelete && onDeleteChat && chatToDelete.isTicket) {
      onDeleteChat(chatToDelete.id, chatToDelete.isTicket);
      toast({
        title: "Chat Deleted",
        description: `${chatToDelete.name} has been removed from your chats.`
      });
      setChatToDelete(null);
    }
  };

  return (
    <div className="w-[240px] border-r overflow-auto">
      <SupportTicketsList
        tickets={supportTickets}
        selectedTicket={selectedTicket}
        onSelectTicket={onSelectTicket}
        onDeleteChat={onDeleteChat}
        unreadCounts={unreadCounts}
        setChatToDelete={setChatToDelete}
      />

      <ClubsList
        clubs={clubs}
        selectedClub={selectedClub}
        onSelectClub={onSelectClub}
        onDeleteChat={onDeleteChat}
        unreadCounts={unreadCounts}
        onSelectUser={onSelectUser}
        setChatToDelete={setChatToDelete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the conversation with {chatToDelete?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatSidebar;
