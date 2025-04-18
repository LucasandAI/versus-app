
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from './chat/ChatDrawer';
import SupportPopover from './shared/SupportPopover';
import CreateClubDialog from './club/CreateClubDialog';
import SearchClubDialog from './club/SearchClubDialog';
import HomeHeader from './home/HomeHeader';
import ClubList from './home/ClubList';
import FindClubsSection from './home/FindClubsSection';
import HomeNotifications from './home/HomeNotifications';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useSupportActions } from '@/hooks/home/useSupportActions';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(chatNotifications);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub
  } = useClubActions();

  const { supportTickets, handleCreateSupportTicket } = useSupportActions();

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleOpenChat = () => {
    setChatDrawerOpen(true);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const userClubs = currentUser?.clubs || [];
  const isAtClubCapacity = userClubs.length >= 3;

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <HomeNotifications 
          setChatNotifications={setUnreadMessages}
          setNotifications={setNotifications}
        />
        
        <HomeHeader 
          notifications={notifications}
          unreadMessages={unreadMessages}
          onMarkAsRead={handleMarkNotificationAsRead}
          onClearAll={handleClearAllNotifications}
          onUserClick={handleSelectUser}
          onJoinClub={handleJoinClub}
          onDeclineInvite={(id) => handleMarkNotificationAsRead(id)}
          onOpenChat={handleOpenChat}
        />

        <ClubList 
          userClubs={userClubs}
          onSelectClub={handleSelectClub}
          onSelectUser={handleSelectUser}
          onCreateClub={() => setCreateClubDialogOpen(true)}
        />

        {!isAtClubCapacity && (
          <FindClubsSection 
            clubs={availableClubs}
            onRequestJoin={handleRequestToJoin}
            onSearchClick={() => setSearchDialogOpen(true)}
            onCreateClick={() => setCreateClubDialogOpen(true)}
          />
        )}

        {isAtClubCapacity && (
          <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="font-medium mb-2">Club Limit Reached</h3>
            <p className="text-gray-500 text-sm mb-4">
              You have reached the maximum of 3 clubs.
            </p>
          </div>
        )}
      </div>

      <ChatDrawer 
        open={chatDrawerOpen} 
        onOpenChange={(open) => {
          setChatDrawerOpen(open);
          if (!open) {
            const event = new CustomEvent('chatDrawerClosed');
            window.dispatchEvent(event);
          }
        }} 
        clubs={userClubs}
        onNewMessage={(count) => setUnreadMessages(count)} 
        supportTickets={supportTickets}
      />

      <SearchClubDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        clubs={availableClubs}
        onRequestJoin={handleRequestToJoin}
      />

      <CreateClubDialog
        open={createClubDialogOpen}
        onOpenChange={setCreateClubDialogOpen}
      />
      
      <SupportPopover onCreateSupportChat={handleCreateSupportTicket} />
    </div>
  );
};

export default HomeView;
