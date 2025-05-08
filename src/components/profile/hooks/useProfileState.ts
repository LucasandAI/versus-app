
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';

// Simple in-memory cache for recently viewed profiles
const profileCache: Record<string, { user: User, timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL

export const useProfileState = () => {
  const { selectedUser, setCurrentView, currentUser, setSelectedUser, currentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Use a shorter loading time for cached data
  useEffect(() => {
    if (selectedUser?.id) {
      const cachedProfile = profileCache[selectedUser.id];
      const now = Date.now();
      
      // If we have a recent cached profile, use a shorter loading time
      if (cachedProfile && (now - cachedProfile.timestamp < CACHE_TTL)) {
        setTimeout(() => {
          setLoading(false);
        }, 100); // Very short loading time for cached profiles
      } else {
        setTimeout(() => {
          setLoading(false);
          
          // Cache the profile for future use
          if (selectedUser) {
            profileCache[selectedUser.id] = {
              user: selectedUser,
              timestamp: now
            };
          }
        }, 300); // Shorter loading time than before but still visible
      }
    }
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
