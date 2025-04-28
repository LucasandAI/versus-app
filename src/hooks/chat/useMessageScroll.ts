
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
      // Fallback if there's no last message ref
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages are loaded initially or component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); 

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length]); // Only trigger when message count changes

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
