
import React from 'react';
import { Club } from '@/types';
import ChatDrawerTabs from './ChatDrawerTabs';
import { X } from 'lucide-react';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: React.Dispatch<React.SetStateAction<"clubs" | "dm">>;
  selectedClub: Club | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ activeTab, setActiveTab, selectedClub }) => {
  return (
    <div className="sticky top-0 z-10 bg-white border-b p-2 flex items-center justify-between">
      <ChatDrawerTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default DrawerHeader;
