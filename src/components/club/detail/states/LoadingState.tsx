
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  timeout?: boolean;
  retryCount?: number;
  onRetry?: () => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  timeout = false, 
  retryCount = 0,
  onRetry
}) => {
  const { setCurrentView } = useApp();

  const handleGoHome = () => {
    setCurrentView('home');
  };
  
  const handleRetry = () => {
    if (onRetry) onRetry();
  };

  // If this is a quick temporary loading state (first load attempt),
  // show a smoother skeleton UI instead of a full page loading state
  if (retryCount === 0 && !timeout) {
    return (
      <div className="container-mobile pt-4 pb-20">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="flex items-center mb-4">
          <Skeleton className="h-10 w-20 rounded-lg mr-2" />
          <Skeleton className="h-10 w-20 rounded-lg mr-2" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // For longer loads or retry attempts, show the full loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full flex flex-col items-center">
        <div className="flex items-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
          <p className="text-gray-700 font-medium">Loading club details...</p>
        </div>
        
        {(timeout || retryCount > 0) && (
          <p className="text-sm text-gray-600 text-center mb-4">
            {retryCount > 0 
              ? `This is taking longer than expected. Retry attempt ${retryCount}/3...` 
              : "This is taking longer than expected."}
          </p>
        )}
        
        <div className="flex gap-3 mt-2">
          {onRetry && (
            <Button variant="default" onClick={handleRetry} size="sm">
              Retry Now
            </Button>
          )}
          <Button variant="outline" onClick={handleGoHome} size="sm">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
