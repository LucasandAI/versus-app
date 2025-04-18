import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from "@/components/ui/button";
import { UserPlus, Settings, Share2, ArrowRight, Award, LogOut, Facebook, Instagram, Twitter, Globe, Linkedin } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ClubInviteDialog from './admin/ClubInviteDialog';
import EditProfileDialog from './profile/EditProfileDialog';
import { Card } from './ui/card';
import { formatLeagueWithTier } from '@/lib/format';
import { toast } from "@/hooks/use-toast";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { useIsMobile } from '@/hooks/use-mobile';

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, currentUser, setSelectedUser, setSelectedClub, currentView, setCurrentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedUser]);

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

  const profileStats = {
    weeklyDistance: 42.3,
    bestLeague: bestLeague.league,
    bestLeagueTier: bestLeague.tier,
    matchesWon: 3,
    matchesLost: 1
  };

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

  const handleOpenStravaProfile = () => {
    window.open('https://www.strava.com/athletes/' + selectedUser?.id, '_blank', 'noopener,noreferrer');
  };

  const handleShareProfile = () => {
    toast({
      title: "Profile shared",
      description: `${selectedUser.name}'s profile link copied to clipboard`,
    });
  };

  const handleSocialLink = (platform: string, username: string) => {
    if (!username) {
      toast({
        title: "No Profile Link",
        description: `No ${platform} profile has been added yet.`,
      });
      return;
    }

    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      facebook: `https://facebook.com/${username}`,
      website: username // Direct URL for website
    };

    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('connect');
    setLogoutDialogOpen(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-20">
      <div className="w-full bg-green-500 py-4 px-6 text-white flex justify-center items-center">
        <h1 className="text-xl font-semibold flex items-center">
          {isCurrentUserProfile ? 'Profile' : `${selectedUser.name}'s Profile`}
        </h1>
      </div>

      <Card className={`w-full ${isMobile ? 'mx-4' : 'max-w-md mx-auto'} mt-4 p-6 rounded-lg`}>
        <div className="flex flex-col space-y-4 w-full">
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
            <p className="text-gray-500">{loading ? <Skeleton className="h-4 w-24 mx-auto" /> : selectedUser.bio || 'Strava Athlete'}</p>
          </div>

          {/* Updated profile action buttons to be in one line */}
          <div className="flex justify-center space-x-2">
            {isCurrentUserProfile ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full"
                        onClick={handleEditProfile}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Settings
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        Social Links
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Share Profile</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleShareProfile}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Profile Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Social Media</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSocialLink('instagram', selectedUser?.instagram || '')}>
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSocialLink('twitter', selectedUser?.twitter || '')}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSocialLink('facebook', selectedUser?.facebook || '')}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSocialLink('linkedin', selectedUser?.linkedin || '')}>
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSocialLink('website', selectedUser?.website || '')}>
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full" 
                        onClick={() => setLogoutDialogOpen(true)}
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Log Out
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      Social Links
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Connect with {selectedUser.name}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSocialLink('instagram', selectedUser?.instagram || '')}>
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialLink('twitter', selectedUser?.twitter || '')}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialLink('facebook', selectedUser?.facebook || '')}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialLink('linkedin', selectedUser?.linkedin || '')}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSocialLink('website', selectedUser?.website || '')}>
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button 
            className="bg-green-500 hover:bg-green-600 text-white w-full"
            onClick={handleOpenStravaProfile}
          >
            Strava Profile
          </Button>

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

      <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <UserPlus className="text-green-500 mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Clubs</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : selectedUser?.clubs && selectedUser.clubs.length > 0 ? (
          <div className="space-y-4">
            {selectedUser.clubs.map((club) => (
              <div 
                key={club.id} 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedClub(club);
                  setCurrentView('clubDetail');
                }}
              >
                <img 
                  src={club.logo} 
                  alt={club.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium">{club.name}</h4>
                  <p className="text-sm text-gray-500">{formatLeagueWithTier(club.division, club.tier)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No clubs joined yet</p>
        )}
      </Card>

      <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <Award className="text-green-500 mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Achievements</h3>
        </div>

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
        
        {isCurrentUserProfile && (
          <Button 
            variant="ghost" 
            className="text-green-600 flex items-center justify-center w-full mt-4"
            onClick={() => setShowMoreAchievements(!showMoreAchievements)}
          >
            View More Achievements <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </Card>

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
