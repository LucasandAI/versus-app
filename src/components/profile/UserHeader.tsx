
import React from 'react';
import { User } from '@/types';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import BackButton from './header/BackButton';
import ProfileAvatar from './header/ProfileAvatar';
import ProfileInfo from './header/ProfileInfo';
import ProfileActions from './header/ProfileActions';

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
      <div className="flex items-center w-full">
        <BackButton />
        <div className="flex items-center gap-6 flex-1">
          <ProfileAvatar 
            loading={loading} 
            name={user.name} 
            avatar={user.avatar} 
          />
          <ProfileInfo 
            loading={loading}
            name={user.name}
            bio={user.bio}
          />
        </div>
      </div>

      <ProfileActions 
        user={user}
        isCurrentUserProfile={isCurrentUserProfile}
        onEditProfile={onEditProfile}
        onLogoutClick={onLogoutClick}
        onShareProfile={handleShareProfile}
      />

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
