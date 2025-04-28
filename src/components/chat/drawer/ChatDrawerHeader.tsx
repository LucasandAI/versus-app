
import React from 'react';
import { X } from 'lucide-react';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { Club } from '@/types';

interface ChatDrawerHeaderProps {
  selectedClub?: Club | null;
}

const ChatDrawerHeader: React.FC<ChatDrawerHeaderProps> = ({ selectedClub }) => {
  const { navigateToClubDetail } = useNavigation();

  const handleClubClick = () => {
    if (selectedClub) {
      navigateToClubDetail(selectedClub.id, selectedClub);
    }
  };

  return (
    <DrawerHeader className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        {selectedClub ? (
          <button 
            onClick={handleClubClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <UserAvatar 
              name={selectedClub.name} 
              image={selectedClub.logo} 
              size="sm"
            />
            <DrawerTitle>{selectedClub.name}</DrawerTitle>
          </button>
        ) : (
          <DrawerTitle>Chats</DrawerTitle>
        )}
        <DrawerClose className="p-1.5 rounded-full hover:bg-gray-100">
          <X className="h-4 w-4" />
        </DrawerClose>
      </div>
    </DrawerHeader>
  );
};

export default ChatDrawerHeader;
