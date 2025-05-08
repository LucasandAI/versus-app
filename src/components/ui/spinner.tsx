
import React from 'react';
import { Loader } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <div className={`animate-spin ${className}`}>
      <Loader size={size} />
    </div>
  );
};
