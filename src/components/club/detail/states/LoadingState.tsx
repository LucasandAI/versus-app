
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

const LoadingState: React.FC = () => {
  const { setCurrentView } = useApp();

  const handleGoHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center mb-4">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
        <p className="text-gray-700">Loading club details...</p>
      </div>
      <p className="text-sm text-gray-500 mb-4">This is taking longer than expected.</p>
      <Button variant="outline" onClick={handleGoHome}>
        Return Home
      </Button>
    </div>
  );
};

export default LoadingState;
