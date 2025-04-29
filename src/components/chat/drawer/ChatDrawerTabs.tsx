
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { Badge } from '@/components/ui/badge';

interface ChatDrawerTabsProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
}

const ChatDrawerTabs: React.FC<ChatDrawerTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  
  const hasUnreadClubs = unreadClubs.size > 0;
  const hasUnreadConversations = unreadConversations.size > 0;
  
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "clubs" | "dm")}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="clubs" className="flex-1 inline-flex items-center gap-2 relative">
          Club Chat
          {hasUnreadClubs && (
            <Badge variant="destructive" className="h-2 w-2 p-0 absolute -top-1 -right-1 rounded-full" />
          )}
        </TabsTrigger>
        <TabsTrigger value="dm" className="flex-1 inline-flex items-center gap-2 relative">
          Direct Messages
          {hasUnreadConversations && (
            <Badge variant="destructive" className="h-2 w-2 p-0 absolute -top-1 -right-1 rounded-full" />
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ChatDrawerTabs;
