
import { useEffect, useRef, useCallback, useState } from 'react';
import { ChatMessage } from '@/types/chat';

interface VirtualizedScrollOptions {
  loadMoreThreshold?: number; // Pixels from top when loadMore should trigger
  smoothScrolling?: boolean; // Whether to use smooth scrolling
  debounceTime?: number; // Debounce time for scroll events in ms
}

export const useVirtualizedScroll = (
  messages: ChatMessage[],
  loadMore: () => void,
  loading: boolean,
  options: VirtualizedScrollOptions = {}
) => {
  const {
    loadMoreThreshold = 150,
    smoothScrolling = true,
    debounceTime = 100
  } = options;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const prevMessageLengthRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollLockRef = useRef<boolean>(false);
  const initialScrollDoneRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  // Clean up timers when unmounting
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced check for scroll position
  const debouncedScrollCheck = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const scrollContainer = scrollRef.current;
      if (!scrollContainer) return;
      
      // Check if at bottom (within a small threshold)
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
      setAtBottom(isAtBottom);
      
      // Check if near top to trigger load more
      if (scrollTop < loadMoreThreshold && !loading && messages.length > 0) {
        loadMore();
      }
    }, debounceTime);
  }, [loadMore, loading, messages.length, debounceTime, loadMoreThreshold]);

  // Track scroll position
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      isUserScrollingRef.current = true;
      debouncedScrollCheck();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [debouncedScrollCheck]);

  // Optimized scroll to bottom with pointer events disabled during scroll
  const scrollToBottom = useCallback((force = false) => {
    if (scrollLockRef.current && !force) return;
    
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    
    scrollLockRef.current = true;
    
    // Disable pointer events during scroll to prevent jank
    scrollContainer.style.pointerEvents = 'none';
    
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = scrollContainer;
      
      if (smoothScrolling) {
        scrollContainer.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: 'smooth'
        });
      } else {
        scrollContainer.scrollTop = scrollHeight - clientHeight;
      }
      
      // Re-enable pointer events after scroll
      setTimeout(() => {
        scrollContainer.style.pointerEvents = '';
        scrollLockRef.current = false;
        setAtBottom(true);
      }, 100);
    });
  }, [smoothScrolling]);

  // Auto-scroll on new messages if already at bottom
  useEffect(() => {
    // Skip if no messages
    if (!messages.length) return;
    
    const isFirstLoad = !initialScrollDoneRef.current;
    const hasNewMessages = messages.length > prevMessageLengthRef.current;
    
    if (isFirstLoad || (hasNewMessages && atBottom)) {
      scrollToBottom();
      initialScrollDoneRef.current = true;
    }
    
    prevMessageLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom, atBottom]);

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom,
    atBottom,
    isUserScrolling: isUserScrollingRef.current
  };
};
