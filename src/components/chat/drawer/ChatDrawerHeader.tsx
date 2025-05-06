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
  return <DrawerHeader className="border-b px-4 py-3">
      
    </DrawerHeader>;
};
export default ChatDrawerHeader;