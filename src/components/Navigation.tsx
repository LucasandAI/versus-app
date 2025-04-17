
import React from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const Navigation: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  const navItems = [
    { view: 'home' as const, label: 'Home', icon: Home },
    { view: 'leaderboard' as const, label: 'Leagues', icon: Trophy },
    { view: 'profile' as const, label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-background border-t border-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
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
