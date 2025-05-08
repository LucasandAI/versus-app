
import React from 'react';

interface ClubAvatarProps {
  name: string;
  imageSrc?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const ClubAvatar: React.FC<ClubAvatarProps> = ({ 
  name, 
  imageSrc, 
  size = 'md', 
  className = '',
  onClick
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-xl'
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center bg-primary text-white ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.src = '';
            e.currentTarget.style.display = 'none';
          }} 
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default ClubAvatar;
