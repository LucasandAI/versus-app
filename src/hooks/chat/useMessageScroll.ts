
import { useEffect, useRef, useCallback, useState } from 'react';

export const useMessageScroll = (messages: any[], chatId?: string) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollLockRef = useRef<boolean>(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  
  // Track chat context to prevent cross-chat interference
  const chatContextRef = useRef<string | undefined>(chatId);
  
  // Update chat context when it changes
  useEffect(() => {
    if (chatContextRef.current !== chatId) {
      chatContextRef.current = chatId;
      isUserScrolling.current = false; 
      previousMessageCount.current = 0;
      // Reset scroll position when chat context changes
      setTimeout(() => {
        scrollToBottom(false);
      }, 10); // Reduced delay for faster response
    }
  }, [chatId]);

  // Optimize scrolling by using a callback with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    // Don't scroll if another scroll is in progress - prevents stuttering
    if (scrollLockRef.current) return;
    
    // Set lock to prevent multiple scroll attempts
    scrollLockRef.current = true;
    
    // Use requestAnimationFrame for better timing with browser paint cycles
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        
        scrollRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
        
        // Update scroll state
        setIsScrolledToBottom(true);
      }
      
      // Release scroll lock after a shorter time to allow quick successive scrolls if needed
      setTimeout(() => {
        scrollLockRef.current = false;
      }, 50); // Reduced from 300ms to improve responsiveness
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
      setIsScrolledToBottom(isAtBottom);
      
      // Debounce scroll state changes
      scrollTimer = setTimeout(() => {
        isUserScrolling.current = !isAtBottom;
        setIsScrolledToBottom(isAtBottom);
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
    
    const shouldScroll = 
      previousMessageCount.current === 0 || 
      (messages.length > previousMessageCount.current && !isUserScrolling.current);
    
    if (shouldScroll) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Use another requestAnimationFrame to catch any layout recalculations
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      });
    }
    
    previousMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom,
    isScrolledToBottom
  };
};
