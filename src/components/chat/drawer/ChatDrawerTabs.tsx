
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatDrawerTabsProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
}

const ChatDrawerTabs: React.FC<ChatDrawerTabsProps> = ({
  activeTab,
  setActiveTab,
  unreadClubs = new Set(),
  unreadConversations = new Set(),
}) => {
  const hasUnreadClubs = unreadClubs.size > 0;
  const hasUnreadConversations = unreadConversations.size > 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "clubs" | "dm")}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="clubs" className="flex-1 relative">
          Club Chat
          {hasUnreadClubs && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="dm" className="flex-1 relative">
          Direct Messages
          {hasUnreadConversations && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ChatDrawerTabs;
