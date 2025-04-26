
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/shared/Button';
import { useApp } from '@/context/AppContext';

interface ErrorStateProps {
  message?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  const { setCurrentView } = useApp();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Club</h2>
        <p className="text-gray-600 mb-6">
          {message || "We couldn't load this club's information. This could be due to network issues or the club may no longer exist."}
        </p>
        <Button
          variant="primary" 
          onClick={() => setCurrentView('home')}
        >
          Go Back Home
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
