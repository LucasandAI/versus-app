
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
  const [showFallback, setShowFallback] = useState(!image);
  
  useEffect(() => {
    // Reset error state when image changes
    setImageError(false);
    
    // Set fallback visibility based on image prop
    setShowFallback(!image || image.trim() === '');
    
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
    setShowFallback(true);
  };

  const initials = getInitials(name);

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick ? 'cursor-pointer' : '')}
      onClick={onClick}
    >
      {!showFallback && !imageError && imageUrl ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name} 
          className="object-cover" 
          onError={handleImageError}
        />
      ) : (
        <AvatarFallback 
          className="bg-slate-300 text-slate-700 font-bold"
          delayMs={0}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default UserAvatar;
