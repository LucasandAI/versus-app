
import React, { useState, useEffect } from 'react';
import { Send, X, Users, ChevronDown, Trophy } from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose 
} from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Club } from '@/types';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import UserAvatar from '../shared/UserAvatar';
import { useApp } from '@/context/AppContext';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onOpenChange, clubs }) => {
  const { setCurrentView, setSelectedUser, setSelectedClub, currentUser } = useApp();
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  
  // Always refresh club list when drawer opens or currentUser changes
  useEffect(() => {
    if (open && currentUser) {
      // Set selected club to first club if none selected yet
      if (!selectedLocalClub && currentUser.clubs.length > 0) {
        setSelectedLocalClub(currentUser.clubs[0]);
      }
    }
  }, [open, currentUser, selectedLocalClub]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
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
    onOpenChange(false); // Close the drawer
  };

  const handleMatchClick = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return;
    
    // Set the selected club in the global context
    setSelectedClub(selectedLocalClub);
    
    // Navigate to club detail view
    setCurrentView('clubDetail');
    
    // Close the drawer
    onOpenChange(false);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedLocalClub || !message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: {
        id: 'currentUser',
        name: 'You',
        avatar: currentUser?.avatar || '/placeholder.svg',
      },
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => ({
      ...prev,
      [selectedLocalClub.id]: [...(prev[selectedLocalClub.id] || []), newMessage]
    }));
    
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated response from ${selectedLocalClub.name}`,
        sender: {
          id: selectedLocalClub.members[0].id,
          name: selectedLocalClub.members[0].name,
          avatar: selectedLocalClub.members[0].avatar,
        },
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedLocalClub.id]: [...(prev[selectedLocalClub.id] || []), responseMessage]
      }));
    }, 1000);
  };

  const getCurrentMatch = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return null;
    return selectedLocalClub.currentMatch;
  };

  const currentMatch = getCurrentMatch();

  // Use the actual currentUser clubs for display
  const userClubs = currentUser?.clubs || [];

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
            clubs={userClubs} 
            selectedClub={selectedLocalClub} 
            onSelectClub={handleSelectClub} 
          />
          
          {selectedLocalClub ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="border-b p-3">
                <h3 className="font-medium">{selectedLocalClub.name}</h3>
                
                {currentMatch && (
                  <div 
                    className="mt-1 mb-2 bg-gray-50 rounded-md p-2 text-xs cursor-pointer hover:bg-gray-100"
                    onClick={handleMatchClick}
                  >
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Trophy className="h-3 w-3" />
                      <span>Current Match</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>{currentMatch.homeClub.name}</span>
                      <div className="flex gap-1 font-medium">
                        <span>{currentMatch.homeClub.totalDistance}km</span>
                        <span>vs</span>
                        <span>{currentMatch.awayClub.totalDistance}km</span>
                      </div>
                      <span>{currentMatch.awayClub.name}</span>
                    </div>
                    <div className="text-gray-500 mt-1 text-center">
                      {currentMatch.status === 'active' ? 'Ends on ' : 'Starting on '}
                      {new Date(currentMatch.endDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-xs text-gray-500 hover:text-primary flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedLocalClub.members.length} members
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-2" align="start">
                    <h4 className="text-sm font-medium mb-2">Club Members</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedLocalClub.members.map(member => (
                        <div 
                          key={member.id} 
                          className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md"
                        >
                          <UserAvatar 
                            name={member.name} 
                            image={member.avatar} 
                            size="sm" 
                            className="cursor-pointer"
                            onClick={() => handleSelectUser(member.id, member.name, member.avatar)} 
                          />
                          <span 
                            className="text-sm truncate cursor-pointer hover:text-primary"
                            onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                          >
                            {member.name}
                          </span>
                          {member.isAdmin && (
                            <span className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded ml-auto">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
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
