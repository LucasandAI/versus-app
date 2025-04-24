
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
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab?: "clubs" | "dm" | "support";
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
  onSelectUser,
  activeTab = "clubs"
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [chatToDelete, setChatToDelete] = useState<{id: string, name: string, isTicket: boolean} | null>(null);

  const handleDeleteChat = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id, chatToDelete.isTicket);
      setChatToDelete(null);
    }
  };

  return (
    <div className="w-[240px] border-r overflow-auto">
      {/* Only show support tickets when the support tab is active */}
      {activeTab === "support" && (
        <SupportTicketsList
          tickets={supportTickets}
          selectedTicket={selectedTicket}
          onSelectTicket={onSelectTicket}
          onDeleteChat={onDeleteChat}
          unreadCounts={unreadCounts}
          setChatToDelete={setChatToDelete}
        />
      )}

      {/* Only show clubs when the clubs tab is active */}
      {activeTab === "clubs" && (
        <ClubsList
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          onDeleteChat={onDeleteChat}
          unreadCounts={unreadCounts}
          onSelectUser={onSelectUser}
          setChatToDelete={setChatToDelete}
        />
      )}

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
