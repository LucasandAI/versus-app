
import React from 'react';
import { useApp } from '@/context/AppContext';
import LoadingScreen from '@/components/shared/LoadingScreen';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/HomeView';
import ClubDetail from '@/components/ClubDetail';
import UserProfile from '@/components/UserProfile';
import Leaderboard from '@/components/Leaderboard';
import Navigation from '@/components/Navigation';
import ToastErrorHandler from '@/components/ToastErrorHandler';
import { useClubMembershipSync } from '@/hooks/useClubMembershipSync';

const AppContent: React.FC = () => {
  const { currentView, isSessionReady, currentUser } = useApp();
  
  // Set up real-time club membership sync
  useClubMembershipSync();

  if (!isSessionReady) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <ConnectScreen />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'clubDetail':
        return <ClubDetail />;
      case 'profile':
        return <UserProfile />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        {renderCurrentView()}
      </main>
      <ToastErrorHandler />
    </div>
  );
};

export default AppContent;
