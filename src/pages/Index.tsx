
import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/HomeView';
import ClubDetail from '@/components/ClubDetail';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';

const AppContent: React.FC = () => {
  const { currentView, currentUser } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        return <ConnectScreen />;
      case 'home':
        return <HomeView />;
      case 'clubDetail':
        return <ClubDetail />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'profile':
        return <UserProfile />;
      default:
        return <ConnectScreen />;
    }
  };

  return (
    <>
      {renderView()}
      {currentUser?.stravaConnected && currentView !== 'connect' && <Navigation />}
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default Index;
