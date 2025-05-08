import React, { useEffect } from 'react';
import LoadingScreen from './shared/LoadingScreen';
import { useApp } from '@/context/AppContext';

interface AppContentProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { currentUser, isSessionReady, isAppReady } = useApp();

  useEffect(() => {
    console.log('[AppContent] State:', {
      hasUser: !!currentUser,
      isSessionReady,
      isAppReady
    });
  }, [currentUser, isSessionReady, isAppReady]);

  // Show loading screen if authenticated but app data not yet ready
  if (currentUser && isSessionReady && !isAppReady) {
    console.log('[AppContent] Showing loading screen - waiting for app data');
    return <LoadingScreen message="Loading your data..." subMessage="Getting everything ready for you. This should only take a moment." />;
  }

  // If we have a user but session isn't ready, show a different loading message
  if (currentUser && !isSessionReady) {
    console.log('[AppContent] Showing loading screen - waiting for session');
    return <LoadingScreen message="Verifying your session..." subMessage="Please wait while we confirm your login status." />;
  }

  // Render children (main app content) once ready
  console.log('[AppContent] Rendering main content');
  return <>{children}</>;
};

export default AppContent;
