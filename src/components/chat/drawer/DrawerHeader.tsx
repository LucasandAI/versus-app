
import React from 'react';
import { Tab, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Club } from '@/types';

export interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  selectedClub: Club | null;
  selectedConversation: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    }
  } | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedClub,
  selectedConversation
}) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Messages</h2>
      </div>
      
      {!selectedClub && !selectedConversation && (
        <Tab defaultValue={activeTab}>
          <TabsList className="w-full">
            <TabsTrigger 
              value="clubs" 
              className="flex-1" 
              onClick={() => setActiveTab("clubs")}
              data-active={activeTab === "clubs"}
            >
              Clubs
            </TabsTrigger>
            <TabsTrigger 
              value="dm" 
              className="flex-1" 
              onClick={() => setActiveTab("dm")}
              data-active={activeTab === "dm"}
            >
              Direct Messages
            </TabsTrigger>
          </TabsList>
        </Tab>
      )}
    </div>
  );
};

export default DrawerHeader;
