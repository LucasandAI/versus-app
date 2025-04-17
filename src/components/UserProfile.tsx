
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from "@/components/ui/button";
import { UserPlus, Settings, Share2, ArrowRight, Award, LogOut, Facebook, Instagram, Twitter, Globe, Linkedin, Edit } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ClubInviteDialog from './admin/ClubInviteDialog';
import EditProfileDialog from './profile/EditProfileDialog';
import { Card } from './ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "@/hooks/use-toast";

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, currentUser, setSelectedUser, currentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  const handleShareProfile = () => {
    toast({
      title: "Profile shared",
      description: `${selectedUser.name}'s profile link copied to clipboard`,
    });
  };

  const handleOpenStravaProfile = () => {
    toast({
      title: "Opening Strava profile",
      description: "Redirecting to Strava...",
    });
  };

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    setCurrentView('connect');
  };

  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleEditSocialLinks = (platform: string) => {
    toast({
      title: `Edit ${platform}`,
      description: `${platform} link update functionality not implemented yet`,
    });
  };

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
            {isCurrentUserProfile ? (
              <>
                {/* Settings button for current user */}
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

                {/* Social Links dropdown for current user */}
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
                    <DropdownMenuLabel>Share Profile</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleShareProfile}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Profile Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Social Media</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => toast({ title: "Instagram", description: "Opening Instagram..." })}>
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Twitter", description: "Opening Twitter..." })}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Facebook", description: "Opening Facebook..." })}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "LinkedIn", description: "Opening LinkedIn..." })}>
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Website", description: "Opening Website..." })}>
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Logout button for current user */}
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
              /* Only social links dropdown for other users */
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
                  <DropdownMenuItem onClick={() => toast({ title: "Instagram", description: "Opening Instagram..." })}>
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "Twitter", description: "Opening Twitter..." })}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "Facebook", description: "Opening Facebook..." })}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "LinkedIn", description: "Opening LinkedIn..." })}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: "Website", description: "Opening Website..." })}>
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Strava profile button */}
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleOpenStravaProfile}>
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
        
        {/* View more button - Only shown on current user's profile */}
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

      {/* Edit Profile Dialog */}
      {isCurrentUserProfile && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          user={currentUser}
        />
      )}

      {/* Logout Confirmation Dialog */}
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
