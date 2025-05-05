
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import CreateClubDialog from './club/CreateClubDialog';
import SearchClubDialog from './club/SearchClubDialog';
import HomeHeader from './home/HomeHeader';
import HomeClubsSection from './home/HomeClubsSection';
import HomeNotificationsHandler from './home/HomeNotificationsHandler';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { ChatDrawerProvider } from '@/context/ChatDrawerContext';
import ChatDrawerHandler from './home/ChatDrawerHandler';
import ClubInviteDialog from './admin/ClubInviteDialog';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser, refreshCurrentUser } = useApp();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedClubForInvite, setSelectedClubForInvite] = useState<Club | null>(null);
  
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
    notifications,
    setNotifications,
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

  const handleInviteClick = (club: Club) => {
    setSelectedClubForInvite(club);
    setInviteDialogOpen(true);
  };

  const userClubs = currentUser?.clubs || [];

  return (
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
            onInviteClick={handleInviteClick}
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
        {selectedClubForInvite && (
          <ClubInviteDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            club={selectedClubForInvite}
          />
        )}
      </div>
    </ChatDrawerProvider>
  );
};

export default HomeView;
