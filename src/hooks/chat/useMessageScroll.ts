
import { useEffect, useRef } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages are loaded initially or component mounts
  useEffect(() => {
    scrollToBottom(false);
    // Add a second attempt with a slight delay to ensure proper scrolling
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); 

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length]); // Only trigger when message count changes

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
