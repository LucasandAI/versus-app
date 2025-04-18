
import { useState } from 'react';

export const useChatDrawer = () => {
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  return {
    chatDrawerOpen,
    setChatDrawerOpen,
  };
};

