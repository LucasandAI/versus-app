
import React from 'react';
import { User, LogOut, Settings, Award, Share2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import Button from './shared/Button';

const UserProfile: React.FC = () => {
  const { currentUser, connectToStrava } = useApp();
  
  // Mock user stats
  const userStats = {
    totalDistance: 237.5,
    activeDays: 18,
    matchesWon: 3,
    matchesLost: 1
  };

  const achievements = [
    { id: 1, title: 'First Victory', description: 'Win your first match', completed: true },
    { id: 2, title: 'Team Player', description: 'Contribute 50km in a single match', completed: true },
    { id: 3, title: 'Ironman', description: 'Log activity every day of a match', completed: false },
    { id: 4, title: 'Division Climber', description: 'Promote to the next division', completed: false },
  ];

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
        <div className="container-mobile">
          <div className="flex items-center">
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

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.totalDistance} km</p>
              <p className="text-xs text-gray-500">Total Distance</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xl font-bold">{userStats.activeDays}</p>
              <p className="text-xs text-gray-500">Active Days</p>
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
            {achievements.map((achievement) => (
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="font-bold mb-3">My Clubs</h2>
          
          {currentUser.clubs.length > 0 ? (
            <div className="space-y-3">
              {currentUser.clubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{club.name}</h3>
                      <span className="text-xs text-gray-500">{club.division} Division</span>
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
