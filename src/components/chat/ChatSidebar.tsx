
import React, { useState, useEffect } from 'react';
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
import { useUnreadMessages } from '@/context/unread-messages';

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
  unreadClubs,
  onSelectUser,
  activeTab = "clubs",
  clubMessages = {}
}) => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [chatToDelete, setChatToDelete] = useState<{id: string, name: string} | null>(null);
  const { unreadClubs: contextUnreadClubs } = useUnreadMessages();

  // Use passed props if available, otherwise use context
  const effectiveUnreadClubs = unreadClubs || contextUnreadClubs;
  
  // State to force re-renders when unread state changes
  const [updateKey, setUpdateKey] = useState(0);
  
  // Listen for unread state changes to force re-render
  useEffect(() => {
    const handleUnreadChanged = () => {
      setUpdateKey(prev => prev + 1);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadChanged);
    window.addEventListener('clubMessageReceived', handleUnreadChanged);
    window.addEventListener('clubMessagesRead', handleUnreadChanged);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadChanged);
      window.removeEventListener('clubMessageReceived', handleUnreadChanged);
      window.removeEventListener('clubMessagesRead', handleUnreadChanged);
    };
  }, []);

  const handleDeleteChat = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id);
      setChatToDelete(null);
    }
  };
  
  // Create a key for forced re-renders
  const unreadKey = JSON.stringify([...effectiveUnreadClubs].sort()) + `-${updateKey}`;

  return (
    <div className="flex-1 overflow-auto bg-white">
      {/* Only show clubs when the clubs tab is active */}
      {activeTab === "clubs" && (
        <ClubsList
          key={`clubs-list-${unreadKey}`}
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          unreadCounts={unreadCounts}
          unreadClubs={effectiveUnreadClubs}
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
