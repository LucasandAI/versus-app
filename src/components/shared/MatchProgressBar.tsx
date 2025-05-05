
import React from 'react';
import { cn } from '@/lib/utils';

interface MatchProgressBarProps {
  homeDistance: number;
  awayDistance: number;
  className?: string;
}

const MatchProgressBar: React.FC<MatchProgressBarProps> = ({
  homeDistance,
  awayDistance,
  className
}) => {
  const total = homeDistance + awayDistance || 1; // Avoid division by zero
  const homePercentage = (homeDistance / total) * 100;
  
  return (
    <div className={cn('w-full rounded-full h-6 overflow-hidden relative', className)}>
      <div className="absolute inset-0 flex w-full">
        <div 
          className="bg-green-500 h-full" 
          style={{ width: `${homePercentage}%` }}
        />
        <div 
          className="bg-gray-800 h-full" 
          style={{ width: `${100 - homePercentage}%` }}
        />
      </div>
      <div className="absolute inset-0 flex justify-between items-center px-3 text-xs font-semibold text-white">
        <span>{homeDistance.toFixed(1)} km</span>
        <span>{awayDistance.toFixed(1)} km</span>
      </div>
    </div>
  );
};

export default MatchProgressBar;
