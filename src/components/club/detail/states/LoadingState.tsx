
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

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
