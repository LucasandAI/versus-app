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

const UserProfile: React.FC = () => {
  const { currentUser, selectedUser, setCurrentUser, setSelectedUser, setCurrentView } = useApp();
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No user selected</p>
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const adminClubs = currentUser?.clubs.filter(club => 
    club.members.some(member => 
      member.id === currentUser.id && member.isAdmin
    )
  ) || [];
  
  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const showInviteButton = !isCurrentUserProfile && adminClubs.length > 0;

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('connect');
    setLogoutDialogOpen(false);
  };

  const getBestLeague = () => {
    if (!selectedUser.clubs || selectedUser.clubs.length === 0) {
      return { league: 'Bronze', tier: 5 };
    }

    const leagueRanking = {
      'Elite': 0,
      'Diamond': 1,
      'Platinum': 2,
      'Gold': 3,
      'Silver': 4,
      'Bronze': 5
    };

    return selectedUser.clubs.reduce((best, club) => {
      const clubRank = leagueRanking[club.division];
      const clubTier = club.tier || 5;
      
      if (clubRank < best.rank || (clubRank === best.rank && clubTier < best.tier)) {
        return { 
          league: club.division, 
          tier: clubTier,
          rank: clubRank
        };
      }
      return best;
    }, { league: 'Bronze', tier: 5, rank: 5 });
  };

  const bestLeague = getBestLeague();

  const completedAchievements = [
    { 
      id: '1', 
      name: 'First Victory', 
      color: 'green',
      description: 'Win your first club match against another club' 
    },
    { 
      id: '2', 
      name: 'Team Player', 
      color: 'green',
      description: 'Contribute at least 20% of your club\'s total distance in a match'
    },
    { 
      id: '3', 
      name: 'Global Explorer', 
      color: 'green',
      description: 'Log activities in 5 different countries'
    }
  ];

  const inProgressAchievements = [
    { 
      id: '4', 
      name: 'Ironman', 
      description: 'Log activity every day of a match'
    },
    { 
      id: '5', 
      name: 'League Climber', 
      description: 'Promote to the next league'
    }
  ];

  const moreInProgressAchievements = [
    {
      id: '6',
      name: 'Distance King',
      description: 'Be the top contributor in your club for 3 consecutive matches'
    },
    {
      id: '7',
      name: 'Club Founder',
      description: 'Create a club and recruit at least 5 members'
    },
    {
      id: '8',
      name: 'Social Butterfly',
      description: 'Connect all your social media accounts to your profile'
    }
  ];

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
