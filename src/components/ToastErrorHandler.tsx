import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Component that listens for error events and shows appropriate toasts
 * This centralizes error handling for read status operations
 */
const ToastErrorHandler: React.FC = () => {
  // Keep track of errors to avoid showing duplicate toasts
  const errorTracker = useRef<Record<string, { count: number, timeout?: NodeJS.Timeout }>>({});
  
  useEffect(() => {
    const handleReadStatusError = (event: CustomEvent) => {
      const { type, id, error } = event.detail;
      const errorKey = `${type}-${id}`;
      
      // If this is the first error for this item, initialize tracking
      if (!errorTracker.current[errorKey]) {
        errorTracker.current[errorKey] = { count: 0 };
      }
      
      // Increment error count
      errorTracker.current[errorKey].count += 1;
      
      // Only show toast if we've had multiple errors for this item
      if (errorTracker.current[errorKey].count >= 2) {
        // Show a toast only once, even if we get multiple errors
        toast.error(
          type === 'club' 
            ? "Failed to mark club messages as read" 
            : "Failed to mark conversation as read",
          {
            id: errorKey,
            duration: 3000
          }
        );
        
        // Reset the counter after showing toast
        errorTracker.current[errorKey].count = 0;
        
        // Clear any existing timeout
        if (errorTracker.current[errorKey].timeout) {
          clearTimeout(errorTracker.current[errorKey].timeout);
        }
        
        // Set a timeout to clean up this entry
        errorTracker.current[errorKey].timeout = setTimeout(() => {
          delete errorTracker.current[errorKey];
        }, 5000);
      }
    };
    
    window.addEventListener('read-status-error', handleReadStatusError as EventListener);
    
    return () => {
      window.removeEventListener('read-status-error', handleReadStatusError as EventListener);
      
      // Clean up any remaining timeouts
      Object.values(errorTracker.current).forEach(entry => {
        if (entry.timeout) {
          clearTimeout(entry.timeout);
        }
      });
    };
  }, []);
  
  // This component doesn't render anything, just handles events
  return null;
};

export default ToastErrorHandler;
