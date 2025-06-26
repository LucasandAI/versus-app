
import { useEffect } from 'react';
import { AppView } from '@/types';

export const useScrollRestoration = (currentView: AppView) => {
  useEffect(() => {
    console.log('[useScrollRestoration] View changed to:', currentView);
    
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Add a small delay to ensure content has fully rendered
      setTimeout(() => {
        console.log('[useScrollRestoration] Scrolling to top');
        window.scrollTo(0, 0);
        
        // Fallback check - verify we actually scrolled to top
        setTimeout(() => {
          if (window.scrollY > 0) {
            console.log('[useScrollRestoration] Fallback scroll triggered');
            window.scrollTo(0, 0);
          }
        }, 50);
      }, 100);
    });
  }, [currentView]);
};
