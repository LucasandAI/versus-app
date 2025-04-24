
import { useState, useEffect } from 'react';

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

  return {
    hiddenDMs,
    hideConversation,
    unhideConversation,
    isConversationHidden
  };
};
