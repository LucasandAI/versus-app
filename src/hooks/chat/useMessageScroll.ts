
import { useRef, useEffect, useState } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const prevMessageLengthRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Function to scroll to bottom
  const scrollToBottom = (immediate = false) => {
    if (!scrollRef.current) return;
    
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use requestAnimationFrame for smoother scrolling
    if (immediate) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else {
      // Small delay to ensure DOM has updated
      scrollTimeoutRef.current = window.setTimeout(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current && isAutoScrollEnabled) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          scrollTimeoutRef.current = null;
        });
      }, 50);
    }
  };
  
  // Detect scroll position to determine if auto-scroll should be enabled
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrollPosition = scrollTop + clientHeight;
      const isCloseToBottom = scrollHeight - scrollPosition < 100;
      
      setIsAutoScrollEnabled(isCloseToBottom);
    };
    
    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Auto-scroll when new messages are added
  useEffect(() => {
    if (messages.length > prevMessageLengthRef.current && isAutoScrollEnabled) {
      scrollToBottom();
    }
    
    prevMessageLengthRef.current = messages.length;
  }, [messages.length, isAutoScrollEnabled]);
  
  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom,
    isAutoScrollEnabled,
    setIsAutoScrollEnabled
  };
};
