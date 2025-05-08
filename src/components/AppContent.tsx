import React from 'react';
import LoadingScreen from './shared/LoadingScreen';
import { useApp } from '@/context/AppContext';

interface AppContentProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { currentUser, isSessionReady, isAppReady } = useApp();

  // Show loading screen if authenticated but app data not yet ready
  if (currentUser && isSessionReady && !isAppReady) {
    return <LoadingScreen />;
  }

  // Render children (main app content) once ready
  return <>{children}</>;
};

export default AppContent;
