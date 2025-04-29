
import React from 'react';
import { useUnreadMessages } from '@/context/unread-messages';
import { Club } from '@/types';
import ChatDrawerTabs from './ChatDrawerTabs';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  selectedClub: Club | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedClub
}) => {
  const { dmUnreadCount, clubUnreadCount } = useUnreadMessages();
  
  return (
    <div className="border-b">
      <ChatDrawerTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        dmUnreadCount={dmUnreadCount}
        clubUnreadCount={clubUnreadCount}
      />
      
      {selectedClub && activeTab === "clubs" && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <h3 className="text-sm font-medium">
            Chatting in <span className="font-bold">{selectedClub.name}</span>
          </h3>
        </div>
      )}
    </div>
  );
};

export default DrawerHeader;
