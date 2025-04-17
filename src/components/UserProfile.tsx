
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from "@/components/ui/button";
import { UserPlus, Settings, Share2, ArrowRight, Award } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ClubInviteDialog from './admin/ClubInviteDialog';
import { Card } from './ui/card';

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, currentUser, setSelectedUser, currentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedUser]);

  // When profile is accessed via navigation menu, show current user's profile
  useEffect(() => {
    if (currentUser && currentView === 'profile' && !selectedUser) {
      setSelectedUser(currentUser);
    }
  }, [currentView, currentUser, selectedUser, setSelectedUser]);

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

  // Mock data for the profile stats
  const profileStats = {
    weeklyDistance: 42.3,
    bestLeague: 'Gold',
    bestLeagueTier: 3,
    matchesWon: 3,
    matchesLost: 1
  };

  // Mock achievements data
  const completedAchievements = [
    { id: '1', name: 'First Victory', color: 'green' },
    { id: '2', name: 'Team Player', color: 'green' },
    { id: '3', name: 'Global Explorer', color: 'green' }
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="w-full bg-green-500 py-4 px-6 text-white flex justify-center items-center">
        <h1 className="text-xl font-semibold flex items-center">
          {isCurrentUserProfile ? 'Profile' : `${selectedUser.name}'s Profile`}
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <UserAvatar 
              name={selectedUser.name} 
              image={selectedUser.avatar} 
              size="lg" 
              className="h-24 w-24"
            />
          )}

          <div className="text-center">
            <h2 className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-32 mx-auto" /> : selectedUser.name}</h2>
            <p className="text-gray-500">{loading ? <Skeleton className="h-4 w-24 mx-auto" /> : 'Strava Athlete'}</p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            {isCurrentUserProfile && (
              <Button variant="ghost" size="sm" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
            
            {/* Only show arrow button on current user's profile */}
            {isCurrentUserProfile && (
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Strava profile button */}
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            Strava Profile
          </Button>

          {/* Invite to club button (only if admin) */}
          {showInviteButton && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 mt-2"
                onClick={() => setInviteDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Invite to Club
              </Button>
              
              <ClubInviteDialog 
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                user={selectedUser}
                adminClubs={adminClubs}
              />
            </>
          )}
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <div className="bg-gray-50 p-4 text-center rounded-lg">
              <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-16 mx-auto" /> : `${profileStats.weeklyDistance} km`}</p>
              <p className="text-gray-500 text-sm">Weekly Contribution</p>
            </div>
            <div className="bg-gray-50 p-4 text-center rounded-lg">
              <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-16 mx-auto" /> : `${profileStats.bestLeague} ${profileStats.bestLeagueTier}`}</p>
              <p className="text-gray-500 text-sm">Best League</p>
            </div>
            <div className="bg-gray-50 p-4 text-center rounded-lg">
              <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-8 mx-auto" /> : profileStats.matchesWon}</p>
              <p className="text-gray-500 text-sm">Matches Won</p>
            </div>
            <div className="bg-gray-50 p-4 text-center rounded-lg">
              <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-8 mx-auto" /> : profileStats.matchesLost}</p>
              <p className="text-gray-500 text-sm">Matches Lost</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements Card */}
      <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <Award className="text-green-500 mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Achievements</h3>
        </div>

        {/* Completed achievements */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Completed</h4>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </>
              ) : (
                completedAchievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className="px-3 py-1 rounded-full bg-white text-green-600 text-xs flex items-center"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {achievement.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* In Progress achievements */}
        <div>
          <h4 className="text-sm font-medium mb-2">In Progress</h4>
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              inProgressAchievements.map(achievement => (
                <div key={achievement.id} className="mb-3">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-gray-500 text-sm">{achievement.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* View more button */}
        <Button 
          variant="ghost" 
          className="text-green-600 flex items-center justify-center w-full mt-4"
          onClick={() => setShowMoreAchievements(!showMoreAchievements)}
        >
          View More Achievements <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Card>
    </div>
  );
};

export default UserProfile;
