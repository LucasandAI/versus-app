
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

interface ErrorStateProps {
  error?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const { setCurrentView } = useApp();

  const handleGoHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <div className="flex items-center justify-center mb-4 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">Unable to Load Club</h2>
        {error && (
          <p className="text-sm text-gray-600 text-center mb-4">
            {error}
          </p>
        )}
        <p className="text-sm text-gray-500 text-center mb-6">
          There was an issue loading the club details. Please try again later.
        </p>
        <div className="flex justify-center">
          <Button onClick={handleGoHome}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
