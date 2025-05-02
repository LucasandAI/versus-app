
import { useEffect, useRef, useCallback } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimize scrolling by using a callback
  const scrollToBottom = useCallback((smooth = true) => {
    // Clear any existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use a small delay to ensure DOM is ready
    scrollTimeoutRef.current = setTimeout(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end',
          inline: 'nearest'
        });
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      scrollTimeoutRef.current = null;
    }, 10);
  }, []);

  // Track user scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      isUserScrolling.current = !isAtBottom;
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Only scroll to bottom on initial load or new messages if user isn't scrolling up
  useEffect(() => {
    if (!messages.length) return;
    
    // Only auto-scroll if:
    // 1. This is the first load (previousMessageCount.current === 0)
    // 2. New messages were added AND user is already at bottom
    const shouldScroll = 
      previousMessageCount.current === 0 || 
      (messages.length > previousMessageCount.current && !isUserScrolling.current);
      
    if (shouldScroll) {
      scrollToBottom(previousMessageCount.current > 0);
    }
    
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
