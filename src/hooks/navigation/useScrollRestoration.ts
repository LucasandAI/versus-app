
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
    // Use requestAnimationFrame to wait for DOM updates, then setTimeout for additional safety
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 10);
    });
  }, [currentView]);

  // Scroll to top when React Router location changes (external navigation)
  useEffect(() => {
    // Use requestAnimationFrame to wait for DOM updates, then setTimeout for additional safety
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 10);
    });
  }, [location.pathname]);
};
