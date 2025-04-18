
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
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset error state when image changes
    setImageError(false);
    
    // Only process valid images
    if (image && image.trim() !== '') {
      // Add cache-busting parameter for non-URL objects (blob URLs don't need cache busting)
      const isObjectUrl = image.startsWith('blob:');
      const url = isObjectUrl ? image : `${image}?t=${Date.now()}`;
      setImageUrl(url);
    } else {
      setImageUrl(undefined);
    }
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

  // Determine if fallback should be shown immediately
  const showFallback = !imageUrl || imageError;

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      {!showFallback && imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={name} 
          className="object-cover" 
          onError={handleImageError}
        />
      )}
      
      {/* Always render the fallback but force immediate display when needed */}
      <AvatarFallback 
        className="bg-secondary text-secondary-foreground"
        delayMs={0} // Always show immediately
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
