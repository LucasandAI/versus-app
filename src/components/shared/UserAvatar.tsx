
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
    
    // For names with multiple words, take first letter of each word (up to 2)
    const words = name.split(' ').filter(word => word.length > 0);
    
    if (words.length > 1) {
      // Get first letter of first word and first letter of last word
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    
    // For single word names or club names with spaces inside brackets
    // like "Road Runners (RR)" - try to extract the initials inside brackets
    const bracketMatch = name.match(/\(([A-Z]{2,})\)/);
    if (bracketMatch && bracketMatch[1]) {
      return bracketMatch[1].substring(0, 2);
    }
    
    // For single word names, take first two letters
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
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

  const shouldShowImage = image && !imageError && image !== '/placeholder.svg';
  const initials = getInitials(name);

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      {shouldShowImage ? (
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
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
