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
  
  // Optimize scrolling by using a callback with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    // Don't scroll if user is actively scrolling up or loading more messages
    if (isUserScrolling.current || isLoadingMore.current) return;
    
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
      
      // Update user scrolling state
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
    
    // Only auto-scroll if:
    // 1. This is a new message (different ID from last message)
    // 2. User is already at bottom
    // 3. Not during initial load
    const shouldScroll = isNewMessage && !isUserScrolling.current && !isInitialLoad.current;
    
    if (shouldScroll && !scrollLockRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom(false); // Use false for auto behavior on message update
      });
    }
    
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
