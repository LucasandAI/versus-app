
import React from 'react';
import { X } from 'lucide-react';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const ChatDrawerHeader = () => {
  return (
    <DrawerHeader className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <DrawerTitle>Chats</DrawerTitle>
        <DrawerClose className="p-1.5 rounded-full hover:bg-gray-100">
          <X className="h-4 w-4" />
        </DrawerClose>
      </div>
    </DrawerHeader>
  );
};

export default ChatDrawerHeader;
