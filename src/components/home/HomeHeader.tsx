
import React from 'react';
import { useApp } from '@/context/AppContext';
import { HomeIcon, PlusCircle, Search, Users, MessageSquare, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationPopover from '../shared/NotificationPopover';
import { Notification } from '@/types';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

interface HomeHeaderProps {
  onCreateClubClick?: () => void;
  onSearchClick?: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (requesterId: string, clubId: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onCreateClubClick,
  onSearchClick,
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onJoinClub,
  onDeclineInvite
}) => {
  const { currentUser, setCurrentView } = useApp();
  const { open: openChatDrawer } = useChatDrawerGlobal();
  
  const handleProfileClick = () => {
    if (currentUser) {
      setCurrentView('profile');
    }
  };

  return (
    <div className="pb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Home</h1>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="p-2 h-9"
          onClick={openChatDrawer}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>

        <NotificationPopover
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onClearAll={onClearAll}
          onUserClick={onUserClick}
          onJoinClub={onJoinClub}
          onDeclineInvite={onDeclineInvite}
        />
        
        {onSearchClick && (
          <Button 
            variant="outline" 
            size="sm" 
            className="p-2 h-9"
            onClick={onSearchClick}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="p-2 h-9"
          onClick={handleProfileClick}
        >
          <UserRound className="h-4 w-4" />
        </Button>

        {onCreateClubClick && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={onCreateClubClick}
            className="h-9"
          >
            <PlusCircle className="h-4 w-4 mr-1" /> 
            <span>Create Club</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
