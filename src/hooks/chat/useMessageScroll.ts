
import { useEffect, useRef } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Only trigger when message count changes

  return {
    scrollRef,
    scrollToBottom
  };
};
