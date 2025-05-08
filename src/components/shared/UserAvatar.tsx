
import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
  initials?: string; // Optional prop for custom initials
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  image,
  size = 'md',
  className,
  onClick,
  initials: customInitials
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Memoize the result of isValidUrl to prevent unnecessary re-evals
  const isValidImage = useMemo(() => {
    if (!image || typeof image !== 'string' || image.trim() === '' || image === '/placeholder.svg') {
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(image);
      return !imageError; // Only valid if both URL is valid and no error occurred
    } catch (e) {
      return false;
    }
  }, [image, imageError]);

  // Memoize initials calculation to prevent re-renders
  const displayInitials = useMemo(() => {
    // Use custom initials if provided
    if (customInitials) return customInitials;
    
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
  }, [name, customInitials]);

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      {isValidImage ? (
        <AvatarImage 
          src={image || ''} 
          alt={name} 
          className="object-cover" 
          onError={handleImageError}
        />
      ) : null}
      
      <AvatarFallback 
        className="bg-primary/10 text-primary font-bold"
      >
        {displayInitials}
      </AvatarFallback>
    </Avatar>
  );
};

// Apply memo to prevent unnecessary re-renders
export default React.memo(UserAvatar);
