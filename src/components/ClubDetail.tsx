import React, { useState } from 'react';
import { ArrowLeft, User as UserIcon, Calendar, TrendingUp, TrendingDown, ArrowRight, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MatchProgressBar from './shared/MatchProgressBar';
import UserAvatar from './shared/UserAvatar';
import { ClubMember } from '@/types';
import Button from './shared/Button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ClubDetail: React.FC = () => {
  const { selectedClub, setCurrentView, currentUser, setSelectedUser, setSelectedClub } = useApp();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  
  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No club selected</p>
        <button 
          onClick={() => setCurrentView('home')}
          className="mt-4 text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const matchHistory = [
    {
      id: 'mh1',
      date: 'April 10-17, 2025',
      homeClub: {
        id: selectedClub?.id,
        name: selectedClub?.name,
        totalDistance: 98.2,
        members: [
          { id: 'u1', name: 'John Runner', avatar: '/placeholder.svg', distance: 32.5 },
          { id: 'u2', name: 'Alice Sprint', avatar: '/placeholder.svg', distance: 28.3 },
          { id: 'u3', name: 'Charlie Run', avatar: '/placeholder.svg', distance: 37.4 }
        ]
      },
      awayClub: {
        id: 'away1',
        name: 'Morning Runners',
        totalDistance: 85.7,
        members: [
          { id: 'a1', name: 'Olivia Pace', avatar: '/placeholder.svg', distance: 30.1 },
          { id: 'a2', name: 'Paul Path', avatar: '/placeholder.svg', distance: 25.8 },
          { id: 'a3', name: 'Sarah Speed', avatar: '/placeholder.svg', distance: 29.8 }
        ]
      },
      result: 'win',
      leagueImpact: {
        type: 'promotion',
        description: 'Promoted to Gold 1'
      }
    },
    {
      id: 'mh2',
      date: 'April 3-10, 2025',
      homeClub: {
        id: 'away2',
        name: 'Sprint Kings',
        totalDistance: 112.4,
        members: [
          { id: 'sk1', name: 'Mike Mile', avatar: '/placeholder.svg', distance: 40.2 },
          { id: 'sk2', name: 'Kate Kilometer', avatar: '/placeholder.svg', distance: 36.1 },
          { id: 'sk3', name: 'Tom Track', avatar: '/placeholder.svg', distance: 36.1 }
        ]
      },
      awayClub: {
        id: selectedClub?.id,
        name: selectedClub?.name,
        totalDistance: 105.8,
        members: [
          { id: 'u1', name: 'John Runner', avatar: '/placeholder.svg', distance: 35.7 },
          { id: 'u2', name: 'Alice Sprint', avatar: '/placeholder.svg', distance: 32.5 },
          { id: 'u3', name: 'Charlie Run', avatar: '/placeholder.svg', distance: 37.6 }
        ]
      },
      result: 'loss',
      leagueImpact: {
        type: 'relegation',
        description: 'Relegated to Silver 1'
      }
    },
    {
      id: 'mh3',
      date: 'March 27-April 3, 2025',
      homeClub: {
        id: selectedClub?.id,
        name: selectedClub?.name,
        totalDistance: 121.5,
        members: [
          { id: 'u1', name: 'John Runner', avatar: '/placeholder.svg', distance: 41.3 },
          { id: 'u2', name: 'Alice Sprint', avatar: '/placeholder.svg', distance: 38.7 },
          { id: 'u3', name: 'Charlie Run', avatar: '/placeholder.svg', distance: 41.5 }
        ]
      },
      awayClub: {
        id: 'away3',
        name: 'Marathon Masters',
        totalDistance: 118.6,
        members: [
          { id: 'mm1', name: 'David Distance', avatar: '/placeholder.svg', distance: 40.2 },
          { id: 'mm2', name: 'Emma Endurance', avatar: '/placeholder.svg', distance: 39.5 },
          { id: 'mm3', name: 'Frank Fitness', avatar: '/placeholder.svg', distance: 38.9 }
        ]
      },
      result: 'win',
      leagueImpact: {
        type: 'promotion',
        description: 'Promoted to Gold 2'
      }
    },
    {
      id: 'mh4',
      date: 'March 20-27, 2025',
      homeClub: {
        id: 'away4',
        name: 'Trail Blazers',
        totalDistance: 89.3,
        members: [
          { id: 'tb1', name: 'Greg Gravel', avatar: '/placeholder.svg', distance: 29.8 },
          { id: 'tb2', name: 'Holly Hill', avatar: '/placeholder.svg', distance: 30.2 },
          { id: 'tb3', name: 'Ian Incline', avatar: '/placeholder.svg', distance: 29.3 }
        ]
      },
      awayClub: {
        id: selectedClub?.id,
        name: selectedClub?.name,
        totalDistance: 92.7,
        members: [
          { id: 'u1', name: 'John Runner', avatar: '/placeholder.svg', distance: 30.5 },
          { id: 'u2', name: 'Alice Sprint', avatar: '/placeholder.svg', distance: 31.2 },
          { id: 'u3', name: 'Charlie Run', avatar: '/placeholder.svg', distance: 31.0 }
        ]
      },
      result: 'win',
      leagueImpact: {
        type: 'promotion',
        description: 'Promoted from Silver 2 to Silver 1'
      }
    }
  ];

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: [] // This would be populated from the backend
    });
    setCurrentView('profile');
  };

  const handleRequestToJoin = () => {
    if (!selectedClub) return;
    
    toast({
      title: "Request Sent",
      description: `Your request to join ${selectedClub.name} has been sent.`,
    });
  };

  const handleViewMatchDetails = (match: any) => {
    setSelectedMatch(match);
  };

  const handleViewClub = (club: any) => {
    setSelectedClub({
      id: club.id,
      name: club.name,
      logo: club.logo || '/placeholder.svg',
      division: 'Gold', // Default division
      members: club.members.map((member: any) => ({
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        isAdmin: false,
        distanceContribution: member.distance
      })),
      matchHistory: []
    });
    
    setSelectedMatch(null);
    
    setCurrentView('clubDetail');
  };

  const currentMatch = selectedClub?.currentMatch;
  const visibleHistory = showAllHistory ? matchHistory : matchHistory.slice(0, 2);
  const isAlreadyMember = selectedClub?.members.some(member => 
    currentUser && member.id === currentUser.id
  );
  
  return (
    <div className="pb-20 relative">
      <div className="bg-primary/95 text-white p-4 sticky top-0 z-10">
        <div className="container-mobile">
          <div className="flex items-center">
            <button onClick={() => setCurrentView('home')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">{selectedClub.name}</h1>
          </div>
        </div>
      </div>

      <div className="container-mobile pt-4">
        {currentMatch && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Current Match</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Ends in 3 days
              </span>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="text-center">
                <div className="bg-gray-200 h-14 w-14 mx-auto rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">{currentMatch.homeClub.name.substring(0, 2)}</span>
                </div>
                <h3 className="mt-1 font-medium text-sm">{currentMatch.homeClub.name}</h3>
                <p className="font-bold text-lg">{currentMatch.homeClub.totalDistance.toFixed(1)} km</p>
              </div>

              <div className="text-center px-2">
                <span className="text-xs font-medium text-gray-500 uppercase">VS</span>
              </div>

              <div className="text-center">
                <div className="bg-gray-200 h-14 w-14 mx-auto rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">{currentMatch.awayClub.name.substring(0, 2)}</span>
                </div>
                <h3 className="mt-1 font-medium text-sm">{currentMatch.awayClub.name}</h3>
                <p className="font-bold text-lg">{currentMatch.awayClub.totalDistance.toFixed(1)} km</p>
              </div>
            </div>

            <MatchProgressBar
              homeDistance={currentMatch.homeClub.totalDistance}
              awayDistance={currentMatch.awayClub.totalDistance}
              className="mb-4"
            />

            <div className="space-y-3 mt-6">
              <h3 className="font-medium text-sm border-b pb-2">Your Team's Contributions</h3>
              {currentMatch.homeClub.members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleSelectUser(member.id, member.name)}
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar name={member.name} image={member.avatar} size="sm" />
                    <span className="text-sm hover:text-primary">{member.name}</span>
                  </div>
                  <span className="font-medium text-sm">
                    {member.distanceContribution?.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Members</h2>
            <span className="text-xs text-gray-500">
              {selectedClub?.members.length}/5 members
            </span>
          </div>

          <div className="space-y-3">
            {selectedClub?.members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleSelectUser(member.id, member.name)}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                  <span className="hover:text-primary">{member.name}</span>
                </div>
                {member.isAdmin && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>

          {selectedClub?.members.length < 5 && !isAlreadyMember && (
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth 
              className="mt-4"
              onClick={handleRequestToJoin}
            >
              Request to Join
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="font-bold mb-2">Club Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">League</p>
              <p className="font-medium">Gold 1</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Match Record</p>
              <p className="font-medium">3W - 1L</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Total Distance</p>
              <p className="font-medium">243.7 km</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Avg. Per Member</p>
              <p className="font-medium">81.2 km</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            <h2 className="font-bold">Match History</h2>
          </div>
          
          <div className="space-y-4">
            {visibleHistory.map((match) => (
              <div key={match.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{match.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    match.result === 'win' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {match.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="font-medium">{match.homeClub.name}</span>
                  <span className="text-xs text-gray-500">vs</span>
                  <span className="font-medium">{match.awayClub.name}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs mb-2">
                  <span>{match.homeClub.totalDistance.toFixed(1)} km</span>
                  <span>{match.awayClub.totalDistance.toFixed(1)} km</span>
                </div>
                
                <MatchProgressBar
                  homeDistance={match.homeClub.totalDistance}
                  awayDistance={match.awayClub.totalDistance}
                  className="h-1.5"
                />
                
                <div className="mt-3 p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center text-xs">
                    <span className="font-medium mr-2">League Impact:</span>
                    {match.leagueImpact.type === 'promotion' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : match.leagueImpact.type === 'relegation' ? (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <ArrowRight className="h-3 w-3 text-gray-500 mr-1" />
                    )}
                    <span className={`${
                      match.leagueImpact.type === 'promotion' 
                        ? 'text-green-600' 
                        : match.leagueImpact.type === 'relegation'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}>
                      {match.leagueImpact.description}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full text-xs"
                  onClick={() => handleViewMatchDetails(match)}
                >
                  View Complete Match Details
                </Button>
              </div>
            ))}
          </div>
          
          {matchHistory.length > 2 && (
            <button 
              className="w-full py-2 mt-3 text-sm text-primary flex items-center justify-center"
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory ? 'Show Less' : 'View All Match History'}
            </button>
          )}
        </div>
      </div>

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              {selectedMatch?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="pb-6">
            <div className="flex justify-center items-center text-lg font-medium gap-3 mb-4">
              <span 
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleViewClub(selectedMatch?.homeClub)}
              >
                {selectedMatch?.homeClub.name}
              </span>
              <span className="text-sm text-gray-500">vs</span>
              <span 
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleViewClub(selectedMatch?.awayClub)}
              >
                {selectedMatch?.awayClub.name}
              </span>
            </div>
            
            <div className="flex justify-center items-center gap-3 mb-4">
              <span className="text-xl font-bold">{selectedMatch?.homeClub.totalDistance.toFixed(1)}</span>
              <span className="text-sm text-gray-500">-</span>
              <span className="text-xl font-bold">{selectedMatch?.awayClub.totalDistance.toFixed(1)}</span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md mb-6">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="font-medium">Result:</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  selectedMatch?.result === 'win' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedMatch?.result === 'win' ? 'WIN' : 'LOSS'}
                </span>
                <span className="mx-2">|</span>
                <span className="font-medium">League Impact:</span>
                {selectedMatch?.leagueImpact.type === 'promotion' ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {selectedMatch?.leagueImpact.description}
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {selectedMatch?.leagueImpact.description}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-center mb-3">
                  <span 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleViewClub(selectedMatch?.homeClub)}
                  >
                    {selectedMatch?.homeClub.name}
                  </span> Members
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Runner</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMatch?.homeClub.members.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span>{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {member.distance.toFixed(1)} km
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div>
                <h3 className="font-medium text-center mb-3">
                  <span 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleViewClub(selectedMatch?.awayClub)}
                  >
                    {selectedMatch?.awayClub.name}
                  </span> Members
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Runner</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMatch?.awayClub.members.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span>{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {member.distance.toFixed(1)} km
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubDetail;
