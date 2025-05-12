import React from 'react';
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
import { useClubConversations } from '@/hooks/chat/messages/useClubConversations';

interface ChatSidebarProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab?: "clubs" | "dm";
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  clubs, 
  selectedClub, 
  onSelectClub,
  onDeleteChat,
  unreadCounts = {},
  unreadClubs = new Set(),
  onSelectUser,
  activeTab = "clubs"
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [chatToDelete, setChatToDelete] = React.useState<{id: string, name: string} | null>(null);
  const clubConversations = useClubConversations(clubs);

  // Force re-render when clubConversations changes
  const [forceRerender, setForceRerender] = React.useState(0);
  React.useEffect(() => {
    setForceRerender(f => f + 1);
  }, [clubConversations]);

  // Key to force re-render when conversations change
  const conversationsKey = clubConversations.map(c => `${c.club.id}:${c.lastMessage?.id || ''}:${c.lastMessage?.timestamp || ''}`).join('|');

  const handleDeleteChat = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id);
      setChatToDelete(null);
    }
  };
  
  // Create a key for forced re-renders
  const unreadKey = JSON.stringify([...unreadClubs].sort());

  return (
    <div className="flex-1 overflow-auto bg-white">
      {/* Only show clubs when the clubs tab is active */}
      {activeTab === "clubs" && (
        <ClubsList
          key={`clubs-list-${unreadKey}-${conversationsKey}-${forceRerender}`}
          clubConversations={clubConversations}
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
