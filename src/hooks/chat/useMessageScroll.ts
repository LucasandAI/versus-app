import React, { useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

export const useMessageScroll = (messages: any[]) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const { currentUser } = useApp();

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Update user scrolling state
    isUserScrollingRef.current = !isAtBottom;
  }, []);

  // Effect to handle new messages and scroll behavior
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isNewMessage = messages.length > 0 && 
      messages[messages.length - 1]?.sender?.id === currentUser?.id;

    // If it's a new message or user is at bottom, scroll to bottom
    if (isNewMessage || !isUserScrollingRef.current) {
      scrollToBottom();
    }

    // Store current scroll height for next update
    lastScrollHeightRef.current = container.scrollHeight;
  }, [messages, currentUser, scrollToBottom]);

  // Effect to handle loading more messages
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const previousHeight = lastScrollHeightRef.current;
    const currentHeight = container.scrollHeight;

    // If height increased (loading more messages), maintain scroll position
    if (currentHeight > previousHeight) {
      const scrollDiff = currentHeight - previousHeight;
      container.scrollTop = scrollDiff;
    }
  }, [messages.length]);

  return {
    scrollContainerRef,
    lastMessageRef,
    handleScroll,
    scrollToBottom
  };
};
