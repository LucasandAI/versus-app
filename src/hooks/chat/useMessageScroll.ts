
import { useEffect, useRef } from 'react';

export const useMessageScroll = (messages: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    if (lastMessageRef.current) {
      // Add a small offset to ensure the timestamp is visible above the input bar
      lastMessageRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
        inline: 'nearest'
      });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages are loaded initially
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages]); // Scroll when messages array changes

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
