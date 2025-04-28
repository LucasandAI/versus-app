
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

const HIDDEN_DMS_KEY = 'hiddenDMs';

export const useHiddenDMs = () => {
  const [hiddenDMs, setHiddenDMs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(HIDDEN_DMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[useHiddenDMs] Error loading hidden DMs from storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_DMS_KEY, JSON.stringify(hiddenDMs));
    } catch (error) {
      console.error('[useHiddenDMs] Error saving hidden DMs to storage:', error);
    }
  }, [hiddenDMs]);

  const hideConversation = (userId: string) => {
    if (!userId) {
      console.error('[useHiddenDMs] Attempted to hide conversation with undefined userId');
      return;
    }
    
    setHiddenDMs(prev => {
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });
    
    toast({
      title: "Conversation hidden",
      description: "You can unhide it later in settings",
    });
  };

  const unhideConversation = (userId: string) => {
    if (!userId) return;
    
    setHiddenDMs(prev => prev.filter(id => id !== userId));
    
    // Removed the "conversation visible" toast as requested
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
