
import React from 'react';
import { Club } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users } from 'lucide-react';

interface DrawerHeaderProps {
  activeTab: 'clubs' | 'dm';
  setActiveTab: (tab: 'clubs' | 'dm') => void;
  selectedClub: Club | null;
  selectedConversation?: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  } | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  selectedClub, 
  selectedConversation 
}) => {
  return (
    <div className="border-b p-4 flex items-center">
      <div className="flex-1 flex justify-center">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'clubs' | 'dm')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="clubs" className="flex items-center gap-2">
              <Users size={16} />
              <span>Clubs</span>
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span>Messages</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default DrawerHeader;
