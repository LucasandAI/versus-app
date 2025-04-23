
import React from 'react';
import ChatDrawerHeader from './ChatDrawerHeader';
import ChatDrawerTabs from './ChatDrawerTabs';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm" | "support";
  setActiveTab: (tab: "clubs" | "dm" | "support") => void;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <>
      <ChatDrawerHeader />
      <ChatDrawerTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default DrawerHeader;
