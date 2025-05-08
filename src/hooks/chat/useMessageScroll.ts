
import { useEffect, useRef, useCallback } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLockRef = useRef<boolean>(false);
  
  // Optimize scrolling by using a callback with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    // Cancel any pending scroll operations
    if (scrollLockRef.current) return;
    
    // Set lock to prevent multiple scroll attempts
    scrollLockRef.current = true;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        
        // Use the modern scrollTo with smooth behavior for better animation
        scrollRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
      
      // Release scroll lock after animation completes
      setTimeout(() => {
        scrollLockRef.current = false;
      }, 300); // Wait for smooth scroll to complete
    });
  }, []);

  // Track user scrolling with passive event listener for better performance
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Consider at bottom if within 100px of bottom (more forgiving)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      isUserScrolling.current = !isAtBottom;
      
      // Debounce scroll state changes
      scrollTimer = setTimeout(() => {
        isUserScrolling.current = !isAtBottom;
      }, 150);
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

  // Scroll on new messages if user is at bottom or on initial load
  useEffect(() => {
    if (!messages.length) return;
    
    // Only auto-scroll if:
    // 1. This is the first load (previousMessageCount.current === 0)
    // 2. New messages were added AND user is already at bottom
    const shouldScroll = 
      previousMessageCount.current === 0 || 
      (messages.length > previousMessageCount.current && !isUserScrolling.current);
    
    if (shouldScroll) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        // Use smooth scrolling for better UX
        scrollToBottom(true);
      });
    }
    
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
