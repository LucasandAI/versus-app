
import { useEffect, useRef } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollHeight = container.scrollHeight;
      const inputHeight = 76; // Height of input + padding
      
      container.scrollTo({
        top: scrollHeight - inputHeight,
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
