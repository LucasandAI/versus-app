
import React from 'react';
import { X } from 'lucide-react';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { Club } from '@/types';

interface ChatDrawerHeaderProps {
  selectedClub?: Club | null;
}

const ChatDrawerHeader: React.FC<ChatDrawerHeaderProps> = ({
  selectedClub
}) => {
  const {
    navigateToClubDetail
  } = useNavigation();
  
  const handleClubClick = () => {
    if (selectedClub) {
      navigateToClubDetail(selectedClub.id, selectedClub);
    }
  };
  
  return (
    <DrawerHeader className="border-b px-4 py-3 flex items-center sticky top-0 z-50 bg-white">
      <DrawerTitle className="flex-1 text-center">
        {selectedClub ? (
          <div 
            className="flex items-center justify-center gap-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleClubClick}
          >
            <UserAvatar 
              name={selectedClub.name} 
              image={selectedClub.logo}
              size="sm"
            />
            <span>{selectedClub.name}</span>
          </div>
        ) : (
          "Chat"
        )}
      </DrawerTitle>
      <DrawerClose className="absolute right-4 top-4">
        <X className="h-4 w-4" />
      </DrawerClose>
    </DrawerHeader>
  );
};

export default ChatDrawerHeader;
