
import React from 'react';
import GoBackHome from '@/components/shared/GoBackHome';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  message?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message = "An error occurred while loading the club." }) => {
  return (
    <div className="container-mobile py-8">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      
      <GoBackHome />
    </div>
  );
};

export default ErrorState;
