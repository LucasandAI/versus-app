
import React from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface NavigationProps {
  // We could add props here in the future if needed, but now we don't need any
}

const Navigation: React.FC<NavigationProps> = () => {
  const { currentView, setCurrentView, setSelectedUser, currentUser } = useApp();

  const handleProfileClick = () => {
    // Set selectedUser to currentUser when clicking profile in nav
    if (currentUser) {
      setSelectedUser(currentUser);
    }
    setCurrentView('profile');
  };

  const navItems = [
    { 
      view: 'home' as const, 
      label: 'Home', 
      icon: Home,
      onClick: () => setCurrentView('home')
    },
    { 
      view: 'leaderboard' as const, 
      label: 'Leagues', 
      icon: Trophy,
      onClick: () => setCurrentView('leaderboard')
    },
    { 
      view: 'profile' as const, 
      label: 'Profile', 
      icon: User,
      onClick: handleProfileClick
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-background border-t border-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center h-full w-full text-xs font-medium transition-colors',
              currentView === item.view
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
