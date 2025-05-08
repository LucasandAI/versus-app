
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClubAvatarProps {
  name: string;
  image?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  online?: boolean;
  onClick?: () => void;
}

const getSize = (size: string) => {
  switch (size) {
    case 'xs': return 'h-7 w-7';
    case 'sm': return 'h-9 w-9';
    case 'lg': return 'h-16 w-16';
    case 'md':
    default: return 'h-12 w-12';
  }
};

const getInitials = (name: string) => {
  if (!name) return 'C';
  return name.charAt(0).toUpperCase();
};

const ClubAvatar: React.FC<ClubAvatarProps> = ({ 
  name, 
  image, 
  size = 'md',
  className = '',
  online = false,
  onClick 
}) => {
  const sizeClass = getSize(size);

  return (
    <div className="relative">
      <Avatar 
        className={cn(sizeClass, className, onClick ? 'cursor-pointer' : '')} 
        onClick={onClick}
      >
        <AvatarImage src={image || ''} alt={name} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </div>
  );
};

export default ClubAvatar;
