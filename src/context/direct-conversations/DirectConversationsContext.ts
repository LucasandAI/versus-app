
import { createContext, useContext } from 'react';
import { DirectConversationsContextValue } from './types';

const DirectConversationsContext = createContext<DirectConversationsContextValue>({
  conversations: [],
  loading: false,
  hasLoaded: false,
  fetchConversations: async () => {},
  refreshConversations: async () => {},
  getOrCreateConversation: async () => null,
});

export const useDirectConversationsContext = () => useContext(DirectConversationsContext);

export default DirectConversationsContext;
