
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Club } from '@/types';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import { useChat } from '@/hooks/useChat';
import { useApp } from '@/context/AppContext';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ 
  open, 
  onOpenChange, 
  clubs,
  onNewMessage 
}) => {
  const { setCurrentView, setSelectedUser, setSelectedClub, currentUser } = useApp();
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const { messages, unreadMessages, refreshKey, handleNewMessage } = useChat(open, onNewMessage);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    setUnreadMessages(prev => ({
      ...prev,
      [club.id]: 0
    }));
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
    onOpenChange(false);
  };

  const handleMatchClick = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return;
    setSelectedClub(selectedLocalClub);
    setCurrentView('clubDetail');
    onOpenChange(false);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedLocalClub || !message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: {
        id: currentUser?.id || 'anonymous',
        name: currentUser?.name || 'Anonymous',
        avatar: currentUser?.avatar || '/placeholder.svg',
      },
      timestamp: new Date().toISOString(),
    };
    
    handleNewMessage(selectedLocalClub.id, newMessage, open);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] rounded-t-xl p-0">
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <DrawerTitle>Chats</DrawerTitle>
            <DrawerClose className="p-1.5 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="flex h-full" key={refreshKey}>
          <ChatSidebar 
            clubs={currentUser?.clubs || []}
            selectedClub={selectedLocalClub} 
            onSelectClub={handleSelectClub}
            unreadCounts={unreadMessages}
          />
          
          {selectedLocalClub ? (
            <div className="flex-1 flex flex-col h-full">
              <ChatHeader 
                club={selectedLocalClub}
                onMatchClick={handleMatchClick}
                onSelectUser={handleSelectUser}
              />
              
              <ChatMessages 
                messages={messages[selectedLocalClub.id] || []} 
                clubMembers={selectedLocalClub.members}
              />
              
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a club to start chatting
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
