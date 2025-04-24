
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';

export const useProfileState = () => {
  const { selectedUser, setCurrentView, currentUser, setSelectedUser, currentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedUser]);

  useEffect(() => {
    if (currentUser && currentView === 'profile' && !selectedUser) {
      setSelectedUser(currentUser);
    }
    
    // Check if the profile being viewed belongs to the current user
    if (currentUser && selectedUser) {
      setIsOwnProfile(currentUser.id === selectedUser.id);
    }
  }, [currentView, currentUser, selectedUser, setSelectedUser]);

  useEffect(() => {
    const handleUserDataUpdate = () => {
      if (selectedUser && currentUser && selectedUser.id === currentUser.id) {
        setSelectedUser(currentUser);
      }
    };
    
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, [currentUser, selectedUser, setSelectedUser]);

  return {
    loading,
    inviteDialogOpen,
    setInviteDialogOpen,
    showMoreAchievements,
    setShowMoreAchievements,
    editProfileOpen,
    setEditProfileOpen,
    logoutDialogOpen,
    setLogoutDialogOpen,
    setCurrentView,
    isOwnProfile
  };
};
