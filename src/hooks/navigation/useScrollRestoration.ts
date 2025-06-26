
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppView } from '@/types';

interface UseScrollRestorationProps {
  currentView: AppView;
}

export const useScrollRestoration = ({ currentView }: UseScrollRestorationProps) => {
  const location = useLocation();

  // Scroll to top when currentView changes (internal navigation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Scroll to top when React Router location changes (external navigation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
