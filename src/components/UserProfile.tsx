
import React, { useEffect, useState } from 'react';
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
import { safeSupabase } from '@/integrations/supabase/safeClient';

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
import { Club, ClubMember, User } from '@/types';
import { transformRawMatchesToMatchType } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';

const UserProfile: React.FC = () => {
  const { currentUser, selectedUser, setCurrentUser, setSelectedUser, setCurrentView, setSelectedClub } = useApp();
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
  
  const [loading, setLoading] = useState(true);
  const [weeklyDistance, setWeeklyDistance] = useState(0);
  
  useEffect(() => {
    const loadUserData = async () => {
      if (!selectedUser) return;
      
      setLoading(true);
      try {
        // Fetch user data from Supabase
        const { data: userData, error } = await safeSupabase
          .from('users')
          .select('id, name, avatar, bio')
          .eq('id', selectedUser.id)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        // Fetch user's clubs from Supabase via club_members join table
        const { data: memberships, error: clubsError } = await safeSupabase
          .from('club_members')
          .select('club_id, is_admin, club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', selectedUser.id);
          
        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
        }
        
        // Transform the clubs data
        const clubs: Club[] = [];
        
        if (memberships && memberships.length > 0) {
          for (const membership of memberships) {
            if (!membership.club) continue;
            
            // Fetch club members
            const { data: membersData, error: membersError } = await safeSupabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', membership.club.id);
              
            if (membersError) {
              console.error('Error fetching club members:', membersError);
              continue;
            }
            
            // Transform members data - using type assertions for now
            const members: ClubMember[] = membersData.map((member: any) => ({
              id: member.users.id,
              name: member.users.name,
              avatar: member.users.avatar || '/placeholder.svg',
              isAdmin: member.is_admin,
              distanceContribution: 0 // Default value
            }));
            
            // Fetch match history
            const { data: matchHistory, error: matchError } = await safeSupabase
              .from('matches')
              .select('*')
              .or(`home_club_id.eq.${membership.club.id},away_club_id.eq.${membership.club.id}`)
              .order('end_date', { ascending: false });
              
            if (matchError) {
              console.error('Error fetching match history:', matchError);
            }
            
            // Transform match data
            const transformedMatches = transformRawMatchesToMatchType(matchHistory || [], membership.club.id);
            
            // Determine correct division value
            const divisionValue = ensureDivision(membership.club.division);
            
            // Transform club data
            clubs.push({
              id: membership.club.id,
              name: membership.club.name,
              logo: membership.club.logo || '/placeholder.svg',
              division: divisionValue,
              tier: membership.club.tier || 1,
              elitePoints: membership.club.elite_points || 0,
              members: members,
              matchHistory: transformedMatches
            });
          }
        }
        
        // Calculate weekly distance (this would be computed from actual activity data in a real app)
        // For now, just generate a random distance for demonstration
        const randomWeeklyDistance = Math.round((Math.random() * 50 + 20) * 10) / 10;
        setWeeklyDistance(randomWeeklyDistance);
        
        // Update the selected user with the fetched data
        const updatedUser: User = {
          id: userData?.id,
          name: userData?.name || selectedUser.name,
          avatar: userData?.avatar || selectedUser.avatar,
          bio: userData?.bio,
          clubs: clubs
        };
        
        setSelectedUser(updatedUser);
        
        // If this is the current user, update currentUser as well
        if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [selectedUser?.id]);

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
    <div className="flex flex-col w-full min-h-screen bg-gray-50 pb-20">
      <div className="w-full">
        <ProfileHeader
          currentUser={currentUser}
          selectedUser={selectedUser}
          onBackClick={() => setCurrentView('home')}
        />
      </div>

      <div className="px-4 w-full max-w-screen-lg mx-auto">
        <Card className={`w-full ${isMobile ? '' : 'max-w-md mx-auto'} mt-4 p-6 rounded-lg`}>
          <UserHeader
            user={selectedUser}
            loading={loading}
            isCurrentUserProfile={isCurrentUserProfile}
            onEditProfile={() => setEditProfileOpen(true)}
            onLogoutClick={() => setLogoutDialogOpen(true)}
          />

          <UserStats
            loading={loading}
            weeklyDistance={weeklyDistance}
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
      </div>

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
