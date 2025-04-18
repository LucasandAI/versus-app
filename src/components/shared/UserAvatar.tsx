
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name: string;
  image?: string | null;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Reset states when image prop changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [image]);

  const getInitials = (name: string) => {
    // Handle empty or null names
    if (!name || name.trim() === '') return 'NA';
    
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

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const initials = getInitials(name);

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      {image && !imageError ? (
        <AvatarImage 
          src={image} 
          alt={name} 
          className="object-cover" 
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : null}
      
      <AvatarFallback 
        className="bg-primary/10 text-primary font-bold"
        delayMs={0}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
