
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';

interface DMChatHeaderProps {
  title: string;
  avatar?: string;
  onClose: () => void;
}

const DMChatHeader: React.FC<DMChatHeaderProps> = ({ title, avatar, onClose }) => {
  return (
    <div className="border-b p-3 flex items-center">
      <button 
        onClick={onClose}
        className="mr-2 p-1 rounded-full hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <UserAvatar name={title} image={avatar} size="sm" />
      <h3 className="font-medium ml-2">{title}</h3>
    </div>
  );
};

export default DMChatHeader;
