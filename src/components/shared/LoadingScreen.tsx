
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading your data...",
  subMessage = "Getting everything ready for you. This should only take a moment.",
  progress
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg">
        <div className="animate-spin">
          <Loader className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-medium text-foreground">{message}</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {subMessage}
        </p>
        
        {progress !== undefined && (
          <div className="w-full max-w-xs mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
