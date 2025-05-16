import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Watch, User, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/unread-messages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';

interface HomeHeaderProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, name: string) => void;
  onDeclineInvite: (id: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onDeclineInvite
}) => {
  const {
    setCurrentView,
    currentUser,
    setSelectedUser
  } = useApp();
  
  const { open } = useChatDrawerGlobal();
  
  const {
    totalUnreadCount,
    refreshUnreadCounts
  } = useUnreadMessages();
  
  const navigate = useNavigate();
  
  // Use unreadCount as a state that can be updated independently
  const [badgeCount, setBadgeCount] = useState(totalUnreadCount);
  const [notificationsCount, setNotificationsCount] = useState(notifications.length);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Debounce timer to limit rapid updates
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Debug log for initial render
  console.log("[HomeHeader] Rendering with notifications:", notifications.length, notifications, "Initial unread count:", totalUnreadCount);

  // Optimize badge count update using useCallback
  const updateBadgeCount = useCallback((forceRefresh = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a small debounce for rapid events
    debounceTimerRef.current = setTimeout(async () => {
      console.log("[HomeHeader] Updating badge count");
      
      if (forceRefresh) {
        await refreshUnreadCounts();
      }
      
      setBadgeCount(totalUnreadCount);
      console.log(`[HomeHeader] Badge count updated to: ${totalUnreadCount}`);
      
      debounceTimerRef.current = null;
    }, 50);
  }, [refreshUnreadCounts, totalUnreadCount]);

  // Keep badgeCount updated when totalUnreadCount changes from the context
  useEffect(() => {
    console.log("[HomeHeader] totalUnreadCount changed to:", totalUnreadCount);
    updateBadgeCount();
  }, [totalUnreadCount, updateBadgeCount]);
  
  // Update notifications count when notifications array changes
  useEffect(() => {
    setNotificationsCount(notifications.length);
  }, [notifications]);

  // Listen for unreadMessagesUpdated event with optimized handler
  useEffect(() => {
    // Using non-arrow function for named function in logs
    function handleUnreadMessagesUpdated(e: Event) {
      console.log("[HomeHeader] Received unreadMessagesUpdated event", (e as CustomEvent).detail);
      updateBadgeCount(true);
    }
    
    function handleMessagesMarkedAsRead(e: Event) {
      console.log("[HomeHeader] Received messagesMarkedAsRead event", (e as CustomEvent).detail);
      updateBadgeCount(true);
    }
    
    function handleNotificationsUpdated() {
      console.log("[HomeHeader] Received notificationsUpdated event");
      setNotificationsCount(notifications.length);
    }
    
    // Add event listeners
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [refreshUnreadCounts, updateBadgeCount, notifications.length]);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  const handleConnectDevice = () => {
    navigate('/connect-device');
  };
  
  const handleLogout = async () => {
    try {
      await clearAllAuthData();
      window.location.reload();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account"
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout error",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Versus</h1>
      <div className="flex items-center gap-2">
        <NotificationPopover 
          notifications={notifications} 
          onMarkAsRead={onMarkAsRead} 
          onClearAll={onClearAll} 
          onUserClick={onUserClick} 
          onDeclineInvite={onDeclineInvite} 
        />
        <Button 
          variant="link" 
          onClick={open} 
          className="text-primary hover:bg-gray-100 rounded-full p-2" 
          icon={<MessageCircle className="h-5 w-5" />} 
          badge={badgeCount > 0 ? badgeCount : 0} 
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <UserAvatar 
                name={currentUser?.name || "User"} 
                image={currentUser?.avatar} 
                size="sm"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewOwnProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Visit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConnectDevice}>
              <Watch className="mr-2 h-4 w-4" />
              <span>Connect a Device</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setHelpDialogOpen(true)}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Help Dialog */}
      {helpDialogOpen ? (
        <Dialog open={helpDialogOpen} onOpenChange={(open) => {
          setHelpDialogOpen(open);
          // Ensure that when dialog is closed, any potential lingering overlay is cleared
          if (!open) {
            // Small timeout to ensure React has time to process the state change
            setTimeout(() => {
              document.body.style.pointerEvents = 'auto';
            }, 100);
          }
        }}>
          <DialogContent 
            className="sm:max-w-md" 
            onEscapeKeyDown={() => setHelpDialogOpen(false)}
            onPointerDownOutside={() => setHelpDialogOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>Need help?</DialogTitle>
              <DialogDescription className="sr-only">Help information</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>For assistance, please email us at <a href="mailto:support@versus.run" className="text-primary font-medium">support@versus.run</a>.</p>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
};

export default HomeHeader;
