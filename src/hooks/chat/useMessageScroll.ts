
import { useEffect, useRef } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest'
      });
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Only trigger when message count changes

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
