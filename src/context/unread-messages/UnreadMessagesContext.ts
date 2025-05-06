
import { createContext, useContext } from 'react';
import { UnreadMessagesContextType } from './types';

// Create a context with a default value
const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  totalUnreadCount: 0,
  clubUnreadCounts: {},
  directMessageUnreadCounts: {},
  refreshUnreadCounts: async () => {}
});

// Export a hook to use this context
export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  
  return context;
};

export default UnreadMessagesContext;
