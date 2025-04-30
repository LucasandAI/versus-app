
import React, { useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
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
import ClubsList from './sidebar/ClubsList';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab?: "clubs" | "dm";
  clubMessages?: Record<string, any[]>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  clubs, 
  selectedClub, 
  onSelectClub,
  onDeleteChat,
  unreadCounts = {},
  unreadClubs = new Set(),
  onSelectUser,
  activeTab = "clubs",
  clubMessages = {}
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [chatToDelete, setChatToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteChat = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id);
      setChatToDelete(null);
    }
  };
  
  // Create a key for forced re-renders
  const unreadKey = JSON.stringify([...unreadClubs].sort());

  return (
    <div className="w-[240px] border-r overflow-auto">
      {/* Only show clubs when the clubs tab is active */}
      {activeTab === "clubs" && (
        <ClubsList
          key={`clubs-list-${unreadKey}`}
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          unreadCounts={unreadCounts}
          unreadClubs={unreadClubs}
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
