
import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose 
} from '@/components/ui/drawer';
import { Club } from '@/types';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onOpenChange, clubs }) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(clubs.length > 0 ? clubs[0] : null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedClub || !message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: {
        id: 'currentUser',
        name: 'You',
        avatar: '/placeholder.svg',
      },
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => ({
      ...prev,
      [selectedClub.id]: [...(prev[selectedClub.id] || []), newMessage]
    }));
    
    // Simulate response after a short delay
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated response from ${selectedClub.name}`,
        sender: {
          id: selectedClub.members[0].id,
          name: selectedClub.members[0].name,
          avatar: selectedClub.members[0].avatar,
        },
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedClub.id]: [...(prev[selectedClub.id] || []), responseMessage]
      }));
    }, 1000);
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
        
        <div className="flex h-full">
          <ChatSidebar 
            clubs={clubs} 
            selectedClub={selectedClub} 
            onSelectClub={handleSelectClub} 
          />
          
          {selectedClub ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="border-b p-3">
                <h3 className="font-medium">{selectedClub.name}</h3>
                <p className="text-xs text-gray-500">{selectedClub.members.length} members</p>
              </div>
              
              <ChatMessages 
                messages={messages[selectedClub.id] || []} 
                clubMembers={selectedClub.members}
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
