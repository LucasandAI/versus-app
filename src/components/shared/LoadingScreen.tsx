import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react'; // Fixed icon import

interface LoadingScreenProps {
  className?: string;
  text?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ className, text = "Loading..." }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full", className)}>
      <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingScreen;
