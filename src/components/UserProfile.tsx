import React, { useState } from 'react';
import { User, LogOut, Settings, Award, Share2, ChevronDown, Instagram, Linkedin, Globe, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import Button from './shared/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const UserProfile: React.FC = () => {
  const { currentUser, connectToStrava, setCurrentView, setSelectedClub, setSelectedUser } = useApp();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userBio, setUserBio] = useState("Strava Athlete");
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    linkedin: "",
    tiktok: "",
    website: ""
  });
  const [showSocialPopover, setShowSocialPopover] = useState(false);
  
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

  const completedAchievements = achievements.filter(a => a.completed);
  const incompleteAchievements = achievements.filter(a => !a.completed);

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

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    // Here would be the actual logout logic
    setCurrentView('connect');
  };

  const handleSocialLinkChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserBio(e.target.value);
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
        {/* Completed Achievements Banner */}
        {completedAchievements.length > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Award className="h-5 w-5 text-primary mr-2" />
              <h2 className="font-bold">Completed Achievements</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedAchievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className="bg-white shadow-sm rounded-full px-3 py-1 text-xs flex items-center"
                >
                  <span className="w-2 h-2 bg-success rounded-full mr-1"></span>
                  {achievement.title}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <UserAvatar 
            name={currentUser.name} 
            image={currentUser.avatar} 
            size="lg"
            className="mx-auto mb-3"
          />
          <h2 className="text-xl font-bold">{currentUser.name}</h2>
          <p className="text-gray-500 mb-4">{userBio}</p>
          
          <div className="flex justify-center space-x-3 mb-4">
            {/* Settings Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-gray-100 p-2 rounded-full">
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Profile Picture</label>
                    <div className="flex items-center space-x-4">
                      <UserAvatar 
                        name={currentUser.name} 
                        image={currentUser.avatar} 
                        size="md"
                      />
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea 
                      className="w-full rounded-md border border-input p-2 text-sm"
                      rows={3}
                      value={userBio}
                      onChange={handleBioChange}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Social Links</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-gray-500" />
                        <input 
                          type="text" 
                          className="flex-1 rounded-md border border-input p-2 text-sm" 
                          placeholder="Instagram username"
                          value={socialLinks.instagram}
                          onChange={e => handleSocialLinkChange('instagram', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Linkedin className="h-4 w-4 text-gray-500" />
                        <input 
                          type="text" 
                          className="flex-1 rounded-md border border-input p-2 text-sm" 
                          placeholder="LinkedIn username"
                          value={socialLinks.linkedin}
                          onChange={e => handleSocialLinkChange('linkedin', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 font-bold text-xs">T</span>
                        <input 
                          type="text" 
                          className="flex-1 rounded-md border border-input p-2 text-sm" 
                          placeholder="TikTok username"
                          value={socialLinks.tiktok}
                          onChange={e => handleSocialLinkChange('tiktok', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <input 
                          type="url" 
                          className="flex-1 rounded-md border border-input p-2 text-sm" 
                          placeholder="Website URL"
                          value={socialLinks.website}
                          onChange={e => handleSocialLinkChange('website', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="primary">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Social Links Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-gray-100 p-2 rounded-full">
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Connect with {currentUser.name}</h3>
                  
                  {Object.entries(socialLinks).some(([_, value]) => value) ? (
                    <div className="space-y-2">
                      {socialLinks.instagram && (
                        <a 
                          href={`https://instagram.com/${socialLinks.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                        >
                          <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                          <span className="text-sm">@{socialLinks.instagram}</span>
                        </a>
                      )}
                      
                      {socialLinks.linkedin && (
                        <a 
                          href={`https://linkedin.com/in/${socialLinks.linkedin}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                        >
                          <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm">{socialLinks.linkedin}</span>
                        </a>
                      )}
                      
                      {socialLinks.tiktok && (
                        <a 
                          href={`https://tiktok.com/@${socialLinks.tiktok}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                        >
                          <span className="flex-shrink-0 w-4 h-4 mr-2 flex items-center justify-center font-bold text-xs">T</span>
                          <span className="text-sm">@{socialLinks.tiktok}</span>
                        </a>
                      )}
                      
                      {socialLinks.website && (
                        <a 
                          href={socialLinks.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                        >
                          <Globe className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm truncate">{socialLinks.website}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No social links available</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Logout Alert Dialog */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <AlertDialogTrigger asChild>
                <button className="bg-gray-100 p-2 rounded-full">
                  <LogOut className="h-5 w-5 text-gray-600" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out? You'll need to connect with Strava again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            {incompleteAchievements
              .slice(0, showAllAchievements ? incompleteAchievements.length : 4)
              .map((achievement) => (
                <div 
                  key={achievement.id} 
                  className="p-3 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">{achievement.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                </div>
              ))}
            
            {incompleteAchievements.length > 4 && (
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
