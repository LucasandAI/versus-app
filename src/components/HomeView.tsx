
import React, { useState } from 'react';
import { Plus, Search, ChevronDown, UserPlus, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import MatchProgressBar from './shared/MatchProgressBar';
import Button from './shared/Button';
import { Club, Match } from '@/types';
import { toast } from "@/components/ui/use-toast";

const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Weekend Warriors',
    logo: '/placeholder.svg',
    division: 'Silver',
    tier: 2,
    members: [
      { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
      { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false },
      { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false },
      { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false },
      { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false },
    ],
    currentMatch: {
      id: 'm1',
      homeClub: {
        id: '1',
        name: 'Weekend Warriors',
        logo: '/placeholder.svg',
        totalDistance: 62.5,
        members: [
          { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 15.3 },
          { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.7 },
          { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.5 },
          { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.2 },
          { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.8 },
        ]
      },
      awayClub: {
        id: '3',
        name: 'Running Rebels',
        logo: '/placeholder.svg',
        totalDistance: 57.2,
        members: [
          { id: '6', name: 'Sarah Swift', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 12.8 },
          { id: '7', name: 'Mike Miler', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.4 },
          { id: '8', name: 'Lisa Long', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.0 },
          { id: '9', name: 'David Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.5 },
          { id: '10', name: 'Kate Speed', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.5 },
        ]
      },
      startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    },
    matchHistory: []
  },
  {
    id: '2',
    name: 'Road Runners',
    logo: '/placeholder.svg',
    division: 'Gold',
    tier: 1,
    members: [
      { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
      { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false },
      { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false },
      { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false },
      { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false },
    ],
    currentMatch: {
      id: 'm2',
      homeClub: {
        id: '2',
        name: 'Road Runners',
        logo: '/placeholder.svg',
        totalDistance: 78.3,
        members: [
          { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.1 },
          { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.4 },
          { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
          { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 14.2 },
          { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.8 },
        ]
      },
      awayClub: {
        id: '4',
        name: 'Trail Blazers',
        logo: '/placeholder.svg',
        totalDistance: 85.1,
        members: [
          { id: '13', name: 'Mark Move', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.3 },
          { id: '14', name: 'Eva Exercise', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.5 },
          { id: '15', name: 'Tom Track', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.3 },
          { id: '16', name: 'Susan Step', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.2 },
          { id: '17', name: 'Robert Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
        ]
      },
      startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    },
    matchHistory: []
  }
];

const availableClubs = [
  {
    id: 'ac1',
    name: 'Morning Joggers',
    division: 'Silver',
    tier: 3,
    members: 3
  },
  {
    id: 'ac2',
    name: 'Hill Climbers',
    division: 'Gold',
    tier: 2,
    members: 4
  },
  {
    id: 'ac3',
    name: 'Urban Pacers',
    division: 'Bronze',
    tier: 5,
    members: 2
  }
];

const HomeView: React.FC = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [clubs] = React.useState<Club[]>(mockClubs);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleRequestToJoin = (clubId: string, clubName: string) => {
    toast({
      title: "Request Sent",
      description: `Your request to join ${clubName} has been sent.`,
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleMembersView = (clubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClubId(expandedClubId === clubId ? null : clubId);
  };

  const handleCreateClub = () => {
    toast({
      title: "Create Club",
      description: "This functionality is not implemented yet.",
    });
  };

  const formatLeagueWithTier = (division: string, tier?: number) => {
    if (division === 'Elite') return 'Elite League';
    return tier ? `${division} ${tier}` : division;
  };

  const handleOpenChat = () => {
    toast({
      title: "Chat",
      description: "Chat functionality is not implemented yet.",
    });
  };

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Clubs</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleOpenChat}
              className="text-primary hover:bg-gray-100 rounded-full p-2"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <UserAvatar 
              name={currentUser?.name || "User"} 
              image={currentUser?.avatar} 
              size="sm"
              onClick={() => setCurrentView('profile')}
            />
          </div>
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
                      {formatLeagueWithTier(club.division, club.tier)}
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
                    <span 
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        const homeClub = clubs.find(c => c.id === club.currentMatch?.homeClub.id);
                        if (homeClub) handleSelectClub(homeClub);
                      }}
                    >{club.currentMatch.homeClub.name}</span>
                    <span className="text-xs text-gray-500">vs</span>
                    <span 
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        const awayClub = clubs.find(c => c.id === club.currentMatch?.awayClub.id);
                        if (awayClub) handleSelectClub(awayClub);
                      }}
                    >{club.currentMatch.awayClub.name}</span>
                  </div>

                  <MatchProgressBar
                    homeDistance={club.currentMatch.homeClub.totalDistance}
                    awayDistance={club.currentMatch.awayClub.totalDistance}
                  />

                  <div className="mt-4">
                    <button 
                      className="w-full py-2 text-sm text-primary flex items-center justify-center"
                      onClick={(e) => toggleMembersView(club.id, e)}
                    >
                      {expandedClubId === club.id ? 'Hide Details' : 'View Details'} 
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expandedClubId === club.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {expandedClubId === club.id && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium mb-2">Home Club Members</p>
                          {club.currentMatch.homeClub.members.map(member => (
                            <div 
                              key={member.id} 
                              className="flex items-center gap-2 mb-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(member.id, member.name);
                              }}
                            >
                              <UserAvatar name={member.name} image={member.avatar} size="sm" />
                              <div>
                                <p className="text-xs font-medium hover:text-primary">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-2">Away Club Members</p>
                          {club.currentMatch.awayClub.members.map(member => (
                            <div 
                              key={member.id} 
                              className="flex items-center gap-2 mb-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(member.id, member.name);
                              }}
                            >
                              <UserAvatar name={member.name} image={member.avatar} size="sm" />
                              <div>
                                <p className="text-xs font-medium hover:text-primary">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleCreateClub}
              >
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
              Clubs looking for members
            </p>

            <div className="space-y-3">
              {availableClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{club.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatLeagueWithTier(club.division, club.tier)} • {club.members}/5 members
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    icon={<UserPlus className="h-4 w-4" />}
                    onClick={() => handleRequestToJoin(club.id, club.name)}
                  >
                    Request
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button 
              variant="primary" 
              size="md"
              onClick={handleCreateClub}
            >
              Create Club
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
