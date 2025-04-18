
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  image,
  size = 'md',
  className,
  onClick
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl'
  };

  // Generate a unique cache-busting timestamp
  // Using a timestamp makes sure the browser doesn't cache the image
  const timestamp = React.useMemo(() => Date.now(), [image]);
  
  // Use default placeholder if image is empty string or undefined
  // Add cache-busting parameter to ensure avatar image refreshes
  const imageSrc = image && image.trim() !== '' 
    ? `${image}?t=${timestamp}` 
    : undefined;

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      <AvatarImage src={imageSrc} alt={name} className="object-cover" />
      <AvatarFallback className="bg-secondary text-secondary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
