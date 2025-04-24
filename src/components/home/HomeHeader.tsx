
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

interface HomeHeaderProps {
  notifications: any[];
  unreadMessages: number;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, name: string) => void;
  onJoinClub: (clubId: string, clubName: string) => void;
  onDeclineInvite: (id: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  notifications,
  unreadMessages,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onJoinClub,
  onDeclineInvite,
}) => {
  const { setCurrentView, currentUser, setSelectedUser } = useApp();
  const { open } = useChatDrawerGlobal();

  const handleViewOwnProfile = () => {
    if (currentUser) {
      // Always set selectedUser to currentUser when clicking the avatar
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">My Clubs</h1>
      <div className="flex items-center gap-2">
        <NotificationPopover 
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onClearAll={onClearAll}
          onUserClick={onUserClick}
          onJoinClub={onJoinClub}
          onDeclineInvite={onDeclineInvite}
        />
        <Button 
          variant="link"
          onClick={open}
          className="text-white hover:bg-gray-100 rounded-full p-2"
          icon={<MessageCircle className="h-5 w-5" />}
          badge={unreadMessages}
        />
        <UserAvatar 
          name={currentUser?.name || "User"} 
          image={currentUser?.avatar} 
          size="sm"
          onClick={handleViewOwnProfile}
        />
      </div>
    </div>
  );
};

export default HomeHeader;
