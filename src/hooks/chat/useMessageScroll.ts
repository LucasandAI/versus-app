import { useEffect, useRef, useCallback } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLockRef = useRef<boolean>(false);
  const isInitialLoad = useRef<boolean>(true);
  const lastMessageId = useRef<string | null>(null);
  const isLoadingMore = useRef<boolean>(false);
  const oldScrollHeight = useRef<number>(0);
  const oldScrollTop = useRef<number>(0);
  const scrollAnimationFrame = useRef<number | null>(null);
  
  // Optimize scrolling by using a callback with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    // Don't scroll if user is actively scrolling up or loading more messages
    if (isUserScrolling.current || isLoadingMore.current) return;
    
    // Prevent multiple scroll attempts in a short time
    if (scrollLockRef.current) return;
    scrollLockRef.current = true;
    
    // Clear any existing scroll timeout and animation frame
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current);
    }
    
    // Use requestAnimationFrame to ensure DOM updates are complete
    scrollAnimationFrame.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        scrollRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
      
      // Release scroll lock after animation completes
      setTimeout(() => {
        scrollLockRef.current = false;
      }, 300); // Increased timeout to account for smooth scroll duration
    });
    
    scrollTimeoutRef.current = null;
  }, []);

  // Track user scrolling with debounced handler - use passive event listener
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let lastScrollTop = 0;
    let lastScrollTime = Date.now();
    
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const currentTime = Date.now();
      const timeDiff = currentTime - lastScrollTime;
      
      // Only consider at bottom if within 50px of bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Detect if user is actively scrolling (based on scroll speed and position)
      const scrollSpeed = Math.abs(scrollTop - lastScrollTop) / timeDiff;
      const isScrolling = scrollSpeed > 0.1 || !isAtBottom;
      
      // Update user scrolling state with debounce
      scrollTimer = setTimeout(() => {
        isUserScrolling.current = isScrolling;
      }, 150); // Increased debounce time for smoother detection
      
      lastScrollTop = scrollTop;
      lastScrollTime = currentTime;
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
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }
    };
  }, []);

  // Only scroll to bottom on new messages if user isn't scrolling up
  useEffect(() => {
    if (!messages.length) return;
    
    // Get the latest message ID
    const latestMessage = messages[messages.length - 1];
    const currentMessageId = latestMessage?.id;
    
    // Check if we're loading more messages (message count increased but no new latest message)
    const isNewMessage = currentMessageId !== lastMessageId.current;
    const isMessageCountIncreased = messages.length > previousMessageCount.current;
    isLoadingMore.current = isMessageCountIncreased && !isNewMessage;
    
    // Store current scroll position before any updates
    if (scrollRef.current) {
      oldScrollHeight.current = scrollRef.current.scrollHeight;
      oldScrollTop.current = scrollRef.current.scrollTop;
    }
    
    // Use requestAnimationFrame to handle scroll position after DOM updates
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current);
    }
    
    scrollAnimationFrame.current = requestAnimationFrame(() => {
      if (scrollRef.current && isLoadingMore.current) {
        // Calculate new scroll position to maintain relative position
        const newScrollHeight = scrollRef.current.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight.current;
        
        // Use smooth scrolling when loading more messages
        scrollRef.current.scrollTo({
          top: oldScrollTop.current + scrollDiff,
          behavior: 'smooth'
        });
      } else if (isNewMessage && !isUserScrolling.current && !isInitialLoad.current) {
        // Only auto-scroll for new messages if user is at bottom
        scrollToBottom(true); // Use smooth scrolling for new messages
      }
    });
    
    // Update message count and last message ID
    previousMessageCount.current = messages.length;
    lastMessageId.current = currentMessageId;
    
    // Reset initial load flag after first render
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [messages, scrollToBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
