
import React from 'react';
import { User } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SocialLinksDropdown from './social/SocialLinksDropdown';
import { toast } from "@/hooks/use-toast"; // Added import for toast

interface UserHeaderProps {
  user: User;
  loading: boolean;
  isCurrentUserProfile: boolean;
  onEditProfile: () => void;
  onLogoutClick: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({
  user,
  loading,
  isCurrentUserProfile,
  onEditProfile,
  onLogoutClick
}) => {
  const handleShareProfile = () => {
    toast({
      title: "Profile shared",
      description: `${user.name}'s profile link copied to clipboard`,
    });
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex items-center gap-6">
        {loading ? (
          <div className="h-24 w-24 rounded-full flex-shrink-0">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
        ) : (
          <UserAvatar 
            name={user.name} 
            image={user.avatar} 
            size="lg" 
            className="h-24 w-24 flex-shrink-0"
          />
        )}
        
        <div className="flex-1">
          <h2 className="text-xl font-bold">
            {loading ? <Skeleton className="h-6 w-32" /> : user.name}
          </h2>
          <p className="text-gray-500">
            {loading ? <Skeleton className="h-4 w-24" /> : user.bio || 'Strava Athlete'}
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {isCurrentUserProfile ? (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    onClick={onEditProfile}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <SocialLinksDropdown user={user} onShareProfile={handleShareProfile} />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full" 
                    onClick={onLogoutClick}
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
          <SocialLinksDropdown user={user} onShareProfile={handleShareProfile} />
        )}
      </div>

      <Button 
        className="bg-green-500 hover:bg-green-600 text-white w-full"
        onClick={() => window.open('https://www.strava.com/athletes/' + user?.id, '_blank', 'noopener,noreferrer')}
      >
        Strava Profile
      </Button>
    </div>
  );
};

export default UserHeader;
