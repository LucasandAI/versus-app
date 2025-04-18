
import React, { useState } from 'react';
import { ArrowLeft, User as UserIcon, Calendar, TrendingUp, TrendingDown, ArrowRight, LogOut, Info, Users, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MatchProgressBar from './shared/MatchProgressBar';
import UserAvatar from './shared/UserAvatar';
import { ClubMember } from '@/types';
import Button from './shared/Button';
import { formatLeagueWithTier } from '@/lib/format';
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
import ClubAdminActions from './admin/ClubAdminActions';
import InviteUserDialog from './club/InviteUserDialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClubDetail: React.FC = () => {
  const { selectedClub, setCurrentView, currentUser, setSelectedUser, setSelectedClub } = useApp();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  
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

  const isNewlyCreatedClub = selectedClub.id !== '1' && selectedClub.id !== '2';
  const hasEnoughMembers = selectedClub.members.length >= 5;
  
  const matchHistory = isNewlyCreatedClub ? [] : [
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

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
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

  const handleLeaveClub = () => {
    toast({
      title: "Left Club",
      description: `You have successfully left ${selectedClub.name}.`,
    });
    setCurrentView('home');
  };

  const currentMatch = !isNewlyCreatedClub || (isNewlyCreatedClub && hasEnoughMembers) 
    ? selectedClub?.currentMatch 
    : null;
  
  const visibleHistory = showAllHistory ? matchHistory : matchHistory.slice(0, 2);
  const isAlreadyMember = selectedClub?.members.some(member => 
    currentUser && member.id === currentUser.id
  );
  const isAdmin = currentUser && selectedClub?.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );
  
  const ClubMembersList = () => (
    <div className="space-y-3">
      {selectedClub?.members.map((member) => (
        <div 
          key={member.id} 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
        >
          <div className="flex items-center gap-3">
            <UserAvatar name={member.name} image={member.avatar} size="sm" />
            <span className="hover:text-primary">{member.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {member.isAdmin && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                Admin
              </span>
            )}
            {currentMatch && (
              <span className="font-medium text-xs text-gray-500">
                {currentMatch.homeClub.members.find(m => m.id === member.id)?.distanceContribution?.toFixed(1) || "0"} km
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
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

      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="mb-4">
                <UserAvatar 
                  name={selectedClub.name} 
                  image={selectedClub.logo} 
                  size="lg"
                  className="h-24 w-24 border-4 border-white shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold text-center md:text-left">{selectedClub.name}</h2>
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium">
                  {formatLeagueWithTier(selectedClub.division, selectedClub.tier)}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                  {selectedClub.members.length}/5 members
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              {!isNewlyCreatedClub && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium">Match Record:</span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    {matchHistory.filter(m => m.result === 'win').length}W
                  </span>
                  <span className="text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    {matchHistory.filter(m => m.result === 'loss').length}L
                  </span>
                </div>
              )}
              <div className="flex space-x-2">
                {selectedClub?.members.length < 5 && currentUser && selectedClub.members.some(m => m.id === currentUser.id && m.isAdmin) && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    Invite Runner
                  </Button>
                )}
                
                {selectedClub?.members.length < 5 && !isAlreadyMember && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleRequestToJoin}
                  >
                    Request to Join
                  </Button>
                )}
                
                {isAlreadyMember && !isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    <LogOut className="w-4 h-4 mr-1" /> Leave Club
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4 text-center md:text-left">
            <p className="text-gray-600 text-sm">
              {selectedClub.bio || `Welcome to ${selectedClub.name}! We're a group of passionate runners looking to challenge ourselves and improve together.`}
            </p>
          </div>
        </div>
      </div>

      <div className="container-mobile pt-4">
        {isNewlyCreatedClub && !hasEnoughMembers && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
            <Info className="text-yellow-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Club needs more members</h3>
              <p className="text-sm text-yellow-700">Your club needs at least 5 members to be eligible for matches. Invite more runners to join!</p>
              {isAdmin && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowInviteDialog(true)}
                >
                  Invite Runners
                </Button>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {matchHistory.length > 0 && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Club Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500">League</p>
                    <p className="font-medium">{formatLeagueWithTier(selectedClub.division, selectedClub.tier)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500">Match Record</p>
                    <p className="font-medium">{matchHistory.length > 0 ? `${matchHistory.filter(m => m.result === 'win').length}W - ${matchHistory.filter(m => m.result === 'loss').length}L` : 'No matches yet'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500">Total Distance</p>
                    <p className="font-medium">{matchHistory.length > 0 ? '243.7 km' : '0 km'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-500">Avg. Per Member</p>
                    <p className="font-medium">{matchHistory.length > 0 ? '81.2 km' : '0 km'}</p>
                  </div>
                </div>
            
                {currentMatch && (
                  <div className="mt-6">
                    <h3 className="font-bold text-md mb-4">Current Match</h3>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-center">
                        <UserAvatar 
                          name={currentMatch.homeClub.name} 
                          image={currentMatch.homeClub.logo} 
                          size="md"
                          className="h-14 w-14 mx-auto" 
                        />
                        <h3 className="mt-1 font-medium text-sm">{currentMatch.homeClub.name}</h3>
                        <p className="font-bold text-lg">{currentMatch.homeClub.totalDistance.toFixed(1)} km</p>
                      </div>

                      <div className="text-center px-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">VS</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full block mt-1">
                          Ends in 3 days
                        </span>
                      </div>

                      <div className="text-center">
                        <UserAvatar 
                          name={currentMatch.awayClub.name} 
                          image={currentMatch.awayClub.logo} 
                          size="md"
                          className="h-14 w-14 mx-auto" 
                        />
                        <h3 className="mt-1 font-medium text-sm">{currentMatch.awayClub.name}</h3>
                        <p className="font-bold text-lg">{currentMatch.awayClub.totalDistance.toFixed(1)} km</p>
                      </div>
                    </div>

                    <MatchProgressBar
                      homeDistance={currentMatch.homeClub.totalDistance}
                      awayDistance={currentMatch.awayClub.totalDistance}
                      className="mb-4"
                    />
                    
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="w-full mt-2 mb-2 text-sm flex items-center justify-center"
                      onClick={() => setShowMatchDetails(!showMatchDetails)}
                    >
                      {showMatchDetails ? 'Hide Team Contributions' : 'View Team Contributions'} 
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMatchDetails ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {showMatchDetails && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                        <div>
                          <p className="text-sm font-medium mb-2">{currentMatch.homeClub.name}</p>
                          <div className="space-y-2">
                            {currentMatch.homeClub.members.map(member => (
                              <div 
                                key={member.id} 
                                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded p-1"
                                onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                              >
                                <div className="flex items-center gap-2">
                                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                                  <span className="text-sm">{member.name}</span>
                                </div>
                                <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">{currentMatch.awayClub.name}</p>
                          <div className="space-y-2">
                            {currentMatch.awayClub.members.map(member => (
                              <div 
                                key={member.id} 
                                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded p-1"
                                onClick={() => handleSelectUser(member.id, member.name, member.avatar)}
                              >
                                <div className="flex items-center gap-2">
                                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                                  <span className="text-sm">{member.name}</span>
                                </div>
                                <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Members
                  </CardTitle>
                  <span className="text-xs text-gray-500">
                    {selectedClub?.members.length}/5 members
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ClubMembersList />
              </CardContent>
            </Card>
          </TabsContent>
          
          {matchHistory.length > 0 && (
            <TabsContent value="history">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Match History
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                              <span className="text-green-600 flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {match.leagueImpact.description}
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {match.leagueImpact.description}
                              </span>
                            )}
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
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {isAlreadyMember && !isAdmin && (
          <Button 
            variant="outline" 
            size="md" 
            fullWidth 
            className="mb-6"
            onClick={() => setShowLeaveDialog(true)}
          >
            <LogOut className="w-4 h-4 mr-2" /> Leave Club
          </Button>
        )}

        {selectedClub && currentUser && (
          <ClubAdminActions club={selectedClub} currentUser={currentUser} />
        )}
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

      {selectedClub && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          clubId={selectedClub.id}
        />
      )}
      
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Club</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave {selectedClub.name}? You can always request to join again in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveClub} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave Club
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClubDetail;
