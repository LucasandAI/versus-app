
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

  // Scroll to bottom when messages are loaded initially
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        scrollToBottom(false);
      }, 0);
    }
  }, [messages]); // Also scroll when messages change completely

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only trigger when message count changes

  return {
    scrollRef,
    lastMessageRef,
    scrollToBottom
  };
};
