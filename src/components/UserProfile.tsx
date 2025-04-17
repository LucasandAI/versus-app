
import React, { useState } from 'react';
import { User, LogOut, Settings, Award, Share2, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import Button from './shared/Button';

const UserProfile: React.FC = () => {
  const { currentUser, connectToStrava, setCurrentView, setSelectedClub, setSelectedUser } = useApp();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  
  const formatLeagueWithTier = (division: string, tier?: number) => {
    if (division === 'Elite') return 'Elite League';
    return tier ? `${division} ${tier}` : division;
  };

  const userStats = {
    matchesWon: 3,
    matchesLost: 1,
    weeklyContribution: 42.3,
    bestLeague: 'Gold'
  };

  const achievements = [
    { id: 1, title: 'First Victory', description: 'Win your first match', completed: true },
    { id: 2, title: 'Team Player', description: 'Contribute 50km in a single match', completed: true },
    { id: 3, title: 'Ironman', description: 'Log activity every day of a match', completed: false },
    { id: 4, title: 'League Climber', description: 'Promote to the next league', completed: false },
    { id: 5, title: 'Century Runner', description: 'Run 100km in a single week', completed: false },
    { id: 6, title: 'Social Butterfly', description: 'Join 3 different clubs', completed: false },
    { id: 7, title: 'Streak Master', description: 'Win 5 matches in a row', completed: false },
    { id: 8, title: 'Global Explorer', description: 'Log activities in 5 different countries', completed: true },
  ];

  const userClubs = [
    {
      id: '1',
      name: 'Weekend Warriors',
      division: 'Silver',
      tier: 2,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
        { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false },
        { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false },
        { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false },
        { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false },
      ]
    },
    {
      id: '2', 
      name: 'Road Runners',
      division: 'Gold',
      tier: 1,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
        { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false },
        { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false },
        { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false },
        { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false },
      ]
    }
  ];

  const handleSelectClub = (club: any) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };
  
  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: [] // This would be populated from the backend
    });
    // No need to change view since we're already in profile view
    // Just updating the selected user
  };
  
  const openStravaProfile = () => {
    window.open('https://www.strava.com/athletes/example', '_blank');
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <User className="h-16 w-16 text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold mb-2">You're not logged in</h2>
        <p className="text-gray-500 mb-6 text-center">Connect with Strava to access your profile</p>
        <Button 
          variant="strava" 
          size="lg" 
          onClick={connectToStrava}
        >
          Connect with Strava
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="bg-primary/95 text-white p-4 sticky top-0 z-10">
        <div className="container-mobile text-center">
          <div className="flex items-center justify-center">
            <User className="h-5 w-5 mr-2" />
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
        </div>
      </div>

      <div className="container-mobile pt-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <UserAvatar 
            name={currentUser.name} 
            image={currentUser.avatar} 
            size="lg"
            className="mx-auto mb-3"
          />
          <h2 className="text-xl font-bold">{currentUser.name}</h2>
          <p className="text-gray-500 mb-4">Strava Athlete</p>
          
          <div className="flex justify-center space-x-3 mb-4">
            <button className="bg-gray-100 p-2 rounded-full">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            <button className="bg-gray-100 p-2 rounded-full">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
            <button className="bg-gray-100 p-2 rounded-full">
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={openStravaProfile}
            className="mt-2"
          >
            Strava Profile
          </Button>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.weeklyContribution} km</p>
              <p className="text-xs text-gray-500">Weekly Contribution</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.bestLeague}</p>
              <p className="text-xs text-gray-500">Best League</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.matchesWon}</p>
              <p className="text-xs text-gray-500">Matches Won</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.matchesLost}</p>
              <p className="text-xs text-gray-500">Matches Lost</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <Award className="h-5 w-5 text-primary mr-2" />
            <h2 className="font-bold">Achievements</h2>
          </div>
          
          <div className="space-y-3">
            {achievements
              .slice(0, showAllAchievements ? achievements.length : 4)
              .map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-3 rounded-md ${achievement.completed ? 'bg-primary/10' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">{achievement.title}</h3>
                    {achievement.completed && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                </div>
              ))}
            
            {achievements.length > 4 && (
              <button 
                className="w-full py-2 text-sm text-primary flex items-center justify-center"
                onClick={() => setShowAllAchievements(!showAllAchievements)}
              >
                {showAllAchievements ? 'Show Less' : 'View More Achievements'} 
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAllAchievements ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="font-bold mb-3">My Clubs</h2>
          
          {userClubs.length > 0 ? (
            <div className="space-y-3">
              {userClubs.map((club) => (
                <div 
                  key={club.id} 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleSelectClub(club)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm hover:text-primary">{club.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatLeagueWithTier(club.division, club.tier)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {club.members.length}/5
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You haven't joined any clubs yet</p>
              <Button variant="primary" size="sm">Create a Club</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
