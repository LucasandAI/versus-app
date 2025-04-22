
import React from 'react';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfileState } from './profile/hooks/useProfileState';
import UserProfileMainContent from './profile/UserProfileMainContent';
import UserProfileDialogs from './profile/UserProfileDialogs';
import { useUserProfileStateLogic } from './profile/hooks/useUserProfileStateLogic';

// NOTE: This file has been refactored for maintainability.
// You may want to further break down props/state if any subcomponent grows too large.

const UserProfile: React.FC = () => {
  const { currentUser, selectedUser, setCurrentUser, setCurrentView, setSelectedClub } = useApp();
  const isMobile = useIsMobile();

  const {
    loading: profileLoading,
    inviteDialogOpen,
    setInviteDialogOpen,
    showMoreAchievements,
    setShowMoreAchievements,
    editProfileOpen,
    setEditProfileOpen,
    logoutDialogOpen,
    setLogoutDialogOpen
  } = useProfileState();

  const { loading, weeklyDistance } = useUserProfileStateLogic();

  // Clubs where currentUser is admin (for "Invite to Club" button)
  const adminClubs = currentUser?.clubs.filter(club =>
    club.members.some(member => member.id === currentUser.id && member.isAdmin)
  ) || [];

  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const showInviteButton = !isCurrentUserProfile && adminClubs.length > 0;

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('connect');
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <UserProfileMainContent
        currentUser={currentUser}
        selectedUser={selectedUser}
        setCurrentView={setCurrentView}
        setEditProfileOpen={setEditProfileOpen}
        setLogoutDialogOpen={setLogoutDialogOpen}
        loading={loading}
        weeklyDistance={weeklyDistance}
        showInviteButton={showInviteButton}
        inviteDialogOpen={inviteDialogOpen}
        setInviteDialogOpen={setInviteDialogOpen}
        showMoreAchievements={showMoreAchievements}
        setShowMoreAchievements={setShowMoreAchievements}
        editProfileOpen={editProfileOpen}
        logoutDialogOpen={logoutDialogOpen}
        adminClubs={adminClubs}
      />
      <UserProfileDialogs
        editProfileOpen={editProfileOpen}
        setEditProfileOpen={setEditProfileOpen}
        currentUser={currentUser}
        logoutDialogOpen={logoutDialogOpen}
        setLogoutDialogOpen={setLogoutDialogOpen}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default UserProfile;
