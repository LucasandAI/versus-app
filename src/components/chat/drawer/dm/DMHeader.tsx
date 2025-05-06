
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMHeader: React.FC<DMHeaderProps> = ({ userId, userName, userAvatar }) => {
  const { navigateToUserProfile } = useNavigation();
  
  return (
    <div className="border-b p-3 flex items-center">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80" 
        onClick={() => navigateToUserProfile(userId, userName, userAvatar)}
      >
        <UserAvatar name={userName} image={userAvatar} size="sm" />
        <h3 className="font-semibold">{userName}</h3>
      </div>
    </div>
  );
};

export default DMHeader;
