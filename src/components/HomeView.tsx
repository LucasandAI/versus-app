
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import CreateClubDialog from './club/CreateClubDialog';
import SearchClubDialog from './club/SearchClubDialog';
import HomeHeader from './home/HomeHeader';
import HomeClubsSection from './home/HomeClubsSection';
import HomeNotifications from './home/HomeNotifications';
import ChatDrawerHandler from './home/ChatDrawerHandler';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { useChatDrawer } from '@/hooks/home/useChatDrawer';
import { ChatDrawerProvider } from '@/context/ChatDrawerContext';

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
    updateUnreadCount,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
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
    <ChatDrawerProvider>
      <div className="pb-20 pt-6">
        <div className="container-mobile">
          <HomeNotifications 
            setChatNotifications={updateUnreadCount}
            setNotifications={setNotifications}
          />
          
          <HomeHeader 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAllNotifications}
            onUserClick={handleSelectUser}
            onJoinClub={handleJoinClub}
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
          setUnreadMessages={updateUnreadCount} // Using the adapter function with correct type
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
  );
};

export default HomeView;
