
import { useState, useEffect } from 'react';
import { useConversations } from '@/hooks/chat/dm/useConversations';

const HIDDEN_DMS_KEY = 'hiddenDMs';

export const useHiddenDMs = () => {
  const [hiddenDMs, setHiddenDMs] = useState<string[]>(() => {
    const stored = localStorage.getItem(HIDDEN_DMS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(HIDDEN_DMS_KEY, JSON.stringify(hiddenDMs));
  }, [hiddenDMs]);

  const hideConversation = (userId: string) => {
    setHiddenDMs(prev => [...prev, userId]);
  };

  const unhideConversation = (userId: string) => {
    setHiddenDMs(prev => prev.filter(id => id !== userId));
  };

  const isConversationHidden = (userId: string) => {
    return hiddenDMs.includes(userId);
  };

  // We're not actually using the conversations here, but we need to expose the refreshConversations method
  // This is a bit of a hack, but it allows components that use useHiddenDMs to also refresh conversations
  const { refreshConversations } = useConversations(hiddenDMs);

  return {
    hiddenDMs,
    hideConversation,
    unhideConversation,
    isConversationHidden,
    refreshConversations
  };
};
