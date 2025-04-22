
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { User } from '@/types';

interface ProfileHeaderProps {
  currentUser: User | null;
  selectedUser: User | null;
  onBackClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  currentUser,
  selectedUser,
  onBackClick
}) => {
  return (
    <div className="w-full bg-green-500 py-4 px-6 text-white flex items-center justify-center relative">
      <button 
        onClick={onBackClick}
        className="absolute left-4 text-white hover:bg-green-600 rounded-full p-2 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h1 className="text-xl font-semibold text-center">
        {currentUser?.id === selectedUser?.id ? 'Profile' : `${selectedUser?.name}'s Profile`}
      </h1>
    </div>
  );
};

export default ProfileHeader;
