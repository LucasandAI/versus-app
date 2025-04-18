
import React, { useState } from 'react';
import { User } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from "@/components/ui/button";
import { Settings, Share2, LogOut } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const handleSocialLink = (platform: string, username: string) => {
    if (!username) {
      toast({
        title: "No Profile Link",
        description: `No ${platform} profile has been added yet.`,
      });
      return;
    }

    let url = '';
    switch(platform) {
      case 'instagram':
        url = `https://instagram.com/${username}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${username}`;
        break;
      case 'facebook': 
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'linkedin':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'website':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${username}`;
        break;
      default:
        url = username;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenStravaProfile = () => {
    window.open('https://www.strava.com/athletes/' + user?.id, '_blank', 'noopener,noreferrer');
  };

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
        onClick={handleOpenStravaProfile}
      >
        Strava Profile
      </Button>
    </div>
  );
};

interface SocialLinksDropdownProps {
  user: User;
  onShareProfile: () => void;
}

const SocialLinksDropdown: React.FC<SocialLinksDropdownProps> = ({ user, onShareProfile }) => {
  const handleSocialLink = (platform: string, username: string) => {
    if (!username) {
      toast({
        title: "No Profile Link",
        description: `No ${platform} profile has been added yet.`,
      });
      return;
    }

    let url = '';
    switch(platform) {
      case 'instagram':
        url = `https://instagram.com/${username}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${username}`;
        break;
      case 'facebook': 
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'linkedin':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'website':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${username}`;
        break;
      default:
        url = username;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
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
        <DropdownMenuLabel>Connect with {user.name}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleSocialLink('instagram', user?.instagram || '')}>
          Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('twitter', user?.twitter || '')}>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('facebook', user?.facebook || '')}>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('linkedin', user?.linkedin || '')}>
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('tiktok', user?.tiktok || '')}>
          TikTok
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('website', user?.website || '')}>
          Website
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserHeader;
