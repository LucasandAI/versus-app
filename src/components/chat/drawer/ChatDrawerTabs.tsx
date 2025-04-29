
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatDrawerTabsProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  dmUnreadCount?: number;
  clubUnreadCount?: number;
}

const ChatDrawerTabs: React.FC<ChatDrawerTabsProps> = ({
  activeTab,
  setActiveTab,
  dmUnreadCount = 0,
  clubUnreadCount = 0,
}) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "clubs" | "dm")}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="clubs" className="flex-1 relative">
          Club Chat
          {clubUnreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {clubUnreadCount > 9 ? '9+' : clubUnreadCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="dm" className="flex-1 relative">
          Direct Messages
          {dmUnreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ChatDrawerTabs;
