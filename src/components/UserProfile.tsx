
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from './ui/card';
import EditProfileDialog from './profile/EditProfileDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

import UserHeader from './profile/UserHeader';
import UserClubs from './profile/UserClubs';
import UserStats from './profile/UserStats';
import UserAchievements from './profile/UserAchievements';
import ProfileHeader from './profile/ProfileHeader';
import UserInviteSection from './profile/UserInviteSection';
import { useProfileState } from './profile/hooks/useProfileState';
import NoUserState from './profile/states/NoUserState';
import { getBestLeague } from './profile/helpers/LeagueHelper';
import { 
  completedAchievements, 
  inProgressAchievements, 
  moreInProgressAchievements 
} from './profile/data/achievements';

const UserProfile: React.FC = () => {
  const { currentUser, selectedUser, setCurrentUser, setSelectedUser, setCurrentView, setSelectedClub } = useApp();
  const isMobile = useIsMobile();
  const {
    loading,
    inviteDialogOpen,
    setInviteDialogOpen,
    showMoreAchievements,
    setShowMoreAchievements,
    editProfileOpen,
    setEditProfileOpen,
    logoutDialogOpen,
    setLogoutDialogOpen
  } = useProfileState();

  if (!selectedUser) {
    return <NoUserState onBackHome={() => setCurrentView('home')} />;
  }

  const adminClubs = currentUser?.clubs.filter(club => 
    club.members.some(member => 
      member.id === currentUser.id && member.isAdmin
    )
  ) || [];
  
  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const showInviteButton = !isCurrentUserProfile && adminClubs.length > 0;
  const bestLeague = getBestLeague(selectedUser.clubs);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('connect');
    setLogoutDialogOpen(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-20">
      <ProfileHeader
        currentUser={currentUser}
        selectedUser={selectedUser}
        onBackClick={() => setCurrentView('home')}
      />

      <Card className={`w-full ${isMobile ? 'mx-4' : 'max-w-md mx-auto'} mt-4 p-6 rounded-lg`}>
        <UserHeader
          user={selectedUser}
          loading={loading}
          isCurrentUserProfile={isCurrentUserProfile}
          onEditProfile={() => setEditProfileOpen(true)}
          onLogoutClick={() => setLogoutDialogOpen(true)}
        />

        <UserStats
          loading={loading}
          weeklyDistance={42.3}
          bestLeague={bestLeague.league}
          bestLeagueTier={bestLeague.tier}
        />

        <UserInviteSection 
          showInviteButton={showInviteButton}
          inviteDialogOpen={inviteDialogOpen}
          setInviteDialogOpen={setInviteDialogOpen}
          selectedUser={selectedUser}
          adminClubs={adminClubs}
        />
      </Card>

      <UserClubs
        user={selectedUser}
        loading={loading}
        onClubClick={(club) => {
          setSelectedClub(club);
          setCurrentView('clubDetail');
        }}
      />

      <UserAchievements
        loading={loading}
        isCurrentUserProfile={isCurrentUserProfile}
        completedAchievements={completedAchievements}
        inProgressAchievements={inProgressAchievements}
        moreInProgressAchievements={moreInProgressAchievements}
        showMoreAchievements={showMoreAchievements}
        onToggleMoreAchievements={() => setShowMoreAchievements(!showMoreAchievements)}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        user={currentUser}
      />

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserProfile;
