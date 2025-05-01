
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import CreateClubDialog from './club/CreateClubDialog';
import SearchClubDialog from './club/SearchClubDialog';
import HomeHeader from './home/HomeHeader';
import HomeClubsSection from './home/HomeClubsSection';
import HomeNotificationsHandler from './home/HomeNotificationsHandler';
import ChatDrawerHandler from './home/ChatDrawerHandler';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { ChatDrawerProvider } from '@/context/ChatDrawerContext';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser, refreshCurrentUser } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs
  } = useClubActions();

  const { 
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications,
    handleJoinClub: handleJoinClubFromNotification
  } = useHomeNotifications();

  useEffect(() => {
    if (currentUser && (!currentUser.clubs || currentUser.clubs.length === 0)) {
      console.log('[HomeView] No clubs found on initial render, refreshing user data');
      refreshCurrentUser().catch(error => {
        console.error('[HomeView] Error refreshing user data:', error);
      });
    } else {
      console.log('[HomeView] User has clubs on initial render:', currentUser?.clubs?.length || 0);
    }
  }, [currentUser, refreshCurrentUser]);

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      clubs: []
    });
    setCurrentView('profile');
  };

  const userClubs = currentUser?.clubs || [];

  return (
    <UnreadMessagesProvider>
      <ChatDrawerProvider>
        <div className="pb-20 pt-6">
          <div className="container-mobile">
            <HomeNotificationsHandler 
              userClubs={userClubs}
              onJoinClub={handleJoinClub}
              onSelectUser={handleSelectUser}
            />
            
            <HomeHeader 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={handleClearAllNotifications}
              onUserClick={handleSelectUser}
              onJoinClub={handleJoinClubFromNotification}
              onDeclineInvite={handleDeclineInvite}
            />

            <HomeClubsSection 
              userClubs={userClubs}
              availableClubs={availableClubs}
              onSelectClub={handleSelectClub}
              onSelectUser={handleSelectUser}
              onCreateClub={() => setCreateClubDialogOpen(true)}
              onRequestJoin={handleRequestToJoin}
              onSearchClick={() => setSearchDialogOpen(true)}
            />
          </div>
          <ChatDrawerHandler 
            userClubs={userClubs}
            onSelectUser={handleSelectUser}
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
        </div>
      </ChatDrawerProvider>
    </UnreadMessagesProvider>
  );
};

export default HomeView;
