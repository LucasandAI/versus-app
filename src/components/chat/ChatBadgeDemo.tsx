
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { simulateNewMessage, simulateMarkAllAsRead } from '@/utils/chat/chatTestUtils';
import { useChatBadge } from '@/hooks/useChatBadge';

/**
 * A demo component that allows testing the chat badge functionality
 * This can be added to any page for development/testing
 */
const ChatBadgeDemo: React.FC = () => {
  const { badgeCount } = useChatBadge();
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-lg p-4 z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Chat Badge Demo</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
          <div className="text-sm">Current badge count: <span className="font-bold">{badgeCount}</span></div>
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              onClick={() => simulateNewMessage()}
            >
              Simulate New Message (+1)
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => simulateMarkAllAsRead()}
            >
              Simulate Mark All Read
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            This panel is for development purposes only.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatBadgeDemo;
