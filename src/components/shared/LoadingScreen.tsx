
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading your data..." 
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg">
        <div className="animate-spin">
          <Loader2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-medium text-foreground">{message}</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Getting everything ready for you. This should only take a moment.
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
