
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppView } from '@/types';

interface UseScrollRestorationProps {
  currentView: AppView;
}

export const useScrollRestoration = ({ currentView }: UseScrollRestorationProps) => {
  const location = useLocation();

  const scrollToTop = () => {
    // Use requestAnimationFrame to wait for DOM updates, then setTimeout with longer delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        
        // Fallback check - if we're still not at the top after a brief moment, try again
        setTimeout(() => {
          if (window.scrollY > 0) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
        }, 50);
      }, 100);
    });
  };

  // Scroll to top when currentView changes (internal navigation)
  useEffect(() => {
    scrollToTop();
  }, [currentView]);

  // Scroll to top when React Router location changes (external navigation)
  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);
};
