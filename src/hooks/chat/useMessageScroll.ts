
import { useEffect, useRef, useCallback } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLockRef = useRef<boolean>(false);
  const initialLoadRef = useRef<boolean>(true);
  
  // Optimize scrolling by using a callback with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    // Prevent multiple scroll attempts in a short time
    if (scrollLockRef.current) return;
    scrollLockRef.current = true;
    
    // Clear any existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        scrollRef.current.scrollTop = scrollHeight - clientHeight;
      }
      
      // Release scroll lock after animation completes
      setTimeout(() => {
        scrollLockRef.current = false;
      }, 50);
    });
    
    scrollTimeoutRef.current = null;
  }, []);

  // Track user scrolling with debounced handler - use passive event listener
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Only consider at bottom if within 50px of bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      isUserScrolling.current = !isAtBottom;
      
      // Debounce scroll state changes
      scrollTimer = setTimeout(() => {
        isUserScrolling.current = !isAtBottom;
      }, 100);
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Only scroll to bottom on initial load or new messages if user isn't scrolling up
  useEffect(() => {
    if (!messages.length) return;
    
    // Always scroll down on first load or when messages appear for the first time
    const isFirstLoad = previousMessageCount.current === 0 && messages.length > 0;
    
    // Only auto-scroll in two scenarios:
    // 1. First load or first messages appearing
    // 2. New messages were added at the end AND user is already at bottom
    const shouldScroll = 
      isFirstLoad || 
      (messages.length > previousMessageCount.current && !isUserScrolling.current);
    
    if (shouldScroll && !scrollLockRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
    
    // Update the message count for next comparison
    previousMessageCount.current = messages.length;
    
    // After initial load, reset the flag
    if (isFirstLoad) {
      initialLoadRef.current = false;
    }
  }, [messages.length, scrollToBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
