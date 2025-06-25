
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  className?: string;
  text?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ className, text = "Loading..." }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full", className)}>
      <div className="flex flex-col items-center space-y-4">
        <img 
          src="/lovable-uploads/617800b4-6533-46ac-b16c-67c26f01a2e0.png" 
          alt="Versus Logo" 
          className="w-20 h-auto object-contain"
        />
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
        {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingScreen;
