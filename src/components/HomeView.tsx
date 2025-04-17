
import React from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import MatchProgressBar from './shared/MatchProgressBar';
import Button from './shared/Button';
import { Club, Match } from '@/types';

// Mock data for development
const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Weekend Warriors',
    logo: '/placeholder.svg',
    division: 'Silver',
    members: [
      { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
      { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false },
      { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false },
    ],
    currentMatch: {
      id: 'm1',
      homeClub: {
        id: '1',
        name: 'Weekend Warriors',
        logo: '/placeholder.svg',
        totalDistance: 62.5,
        members: [
          { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 25.3 },
          { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 18.7 },
          { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 18.5 },
        ]
      },
      awayClub: {
        id: '2',
        name: 'Running Rebels',
        logo: '/placeholder.svg',
        totalDistance: 57.2,
        members: [
          { id: '4', name: 'Sarah Swift', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 21.8 },
          { id: '5', name: 'Mike Miler', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 19.4 },
          { id: '6', name: 'Lisa Long', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.0 },
        ]
      },
      startDate: '2023-04-10',
      endDate: '2023-04-17',
      status: 'active'
    },
    matchHistory: []
  }
];

const HomeView: React.FC = () => {
  const { setCurrentView, setSelectedClub } = useApp();
  const [clubs] = React.useState<Club[]>(mockClubs);

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  // Calculate days remaining for the match
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Clubs</h1>
          <button className="bg-primary rounded-full p-2 text-white">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {clubs.map((club) => (
            <div 
              key={club.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
              onClick={() => handleSelectClub(club)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-200 h-12 w-12 rounded-full flex items-center justify-center">
                  <span className="font-bold text-gray-700">{club.name.substring(0, 2)}</span>
                </div>
                <div>
                  <h3 className="font-medium">{club.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {club.division} Division
                    </span>
                    <span className="text-xs text-gray-500">
                      • {club.members.length} members
                    </span>
                  </div>
                </div>
              </div>

              {club.currentMatch && (
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Current Match</h4>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      {getDaysRemaining(club.currentMatch.endDate)} days left
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="font-medium">{club.currentMatch.homeClub.name}</span>
                    <span className="text-xs text-gray-500">vs</span>
                    <span className="font-medium">{club.currentMatch.awayClub.name}</span>
                  </div>

                  <MatchProgressBar
                    homeDistance={club.currentMatch.homeClub.totalDistance}
                    awayDistance={club.currentMatch.awayClub.totalDistance}
                  />
                </div>
              )}
            </div>
          ))}

          {clubs.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="font-medium mb-2">No clubs yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Create or join a club to start competing
              </p>
              <Button variant="primary" size="sm">
                Create Club
              </Button>
            </div>
          )}
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Find Clubs</h2>
            <button className="text-primary flex items-center gap-1">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-gray-500 text-sm mb-4">
              Popular clubs in your area
            </p>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs text-gray-700">RC{i}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Running Club {i}</h3>
                      <span className="text-xs text-gray-500">Gold Division • 5 members</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">Join</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
