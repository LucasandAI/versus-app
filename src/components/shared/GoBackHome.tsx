
import React from 'react';
import { useApp } from '@/context/AppContext';

const GoBackHome: React.FC = () => {
  const { setCurrentView } = useApp();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>No club selected</p>
      <button 
        onClick={() => setCurrentView('home')}
        className="mt-4 text-primary hover:underline"
      >
        Go back home
      </button>
    </div>
  );
};

export default GoBackHome;
