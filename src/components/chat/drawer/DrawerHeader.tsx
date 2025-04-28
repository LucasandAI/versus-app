
import React from 'react';
import ChatDrawerHeader from './ChatDrawerHeader';
import ChatDrawerTabs from './ChatDrawerTabs';
import { Club } from '@/types';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  selectedClub?: Club | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedClub
}) => {
  return (
    <>
      <ChatDrawerHeader selectedClub={selectedClub} />
      <ChatDrawerTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default DrawerHeader;
