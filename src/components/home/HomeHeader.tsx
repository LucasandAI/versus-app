
import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Watch, User, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
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
  
  const {
    open
  } = useChatDrawerGlobal();
  
  const {
    totalUnreadCount,
    fetchUnreadCounts
  } = useUnreadMessages();
  
  const navigate = useNavigate();
  
  const [badgeCount, setBadgeCount] = useState(totalUnreadCount);
  const [notificationsCount, setNotificationsCount] = useState(notifications.length);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  console.log("[HomeHeader] Rendering with notifications:", notifications.length, notifications);

  // Update badge count immediately when totalUnreadCount changes
  useEffect(() => {
    console.log("[HomeHeader] Total unread count updated:", totalUnreadCount);
    setBadgeCount(totalUnreadCount);
    
    // If this is first load, mark that we've done initial load
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [totalUnreadCount, isFirstLoad]);
  
  // Update notifications count when notifications array changes
  useEffect(() => {
    setNotificationsCount(notifications.length);
  }, [notifications]);

  // Handle badge update efficiently with a dedicated callback
  const handleBadgeUpdate = useCallback((event?: CustomEvent) => {
    const immediate = event?.detail?.immediate === true;
    const forceRecalculation = event?.detail?.forceTotalRecalculation === true;
    
    console.log("[HomeHeader] Badge update triggered", { 
      immediate, 
      forceRecalculation
    });
    
    // Avoid too frequent fetches unless forced
    const now = Date.now();
    if (!immediate && !forceRecalculation && now - lastRefreshTime < 1000) {
      console.log("[HomeHeader] Skipping fetch, too soon since last refresh");
      return;
    }
    
    // Update last refresh time
    setLastRefreshTime(now);
    
    // Force a full refresh of unread counts from server
    fetchUnreadCounts().then(() => {
      // Then ensure the badge displays the updated count
      setTimeout(() => {
        setBadgeCount(prev => {
          const newCount = totalUnreadCount;
          console.log("[HomeHeader] Badge count set to:", newCount, "was:", prev);
          return newCount;
        });
      }, immediate ? 0 : 50);
    });
  }, [fetchUnreadCounts, totalUnreadCount, lastRefreshTime]);

  // Handle conversation opened to refresh badge immediately
  const handleConversationOpened = useCallback((event: CustomEvent) => {
    console.log("[HomeHeader] Conversation opened event received", event.detail);
    
    // For improved UX, we optimistically update the badge count when a conversation is opened
    setBadgeCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log(`[HomeHeader] Badge count reduced after conversation opened: ${prev} -> ${newCount}`);
      return newCount;
    });
    
    // Then trigger a full refresh for accuracy
    setTimeout(() => {
      handleBadgeUpdate({ detail: { immediate: true } } as CustomEvent);
    }, 100);
    
  }, [handleBadgeUpdate]);

  // Listen for unreadMessagesUpdated event to update badge count
  useEffect(() => {
    const handleUnreadMessagesUpdated = (event: CustomEvent) => {
      console.log("[HomeHeader] Unread messages updated event received", event.detail);
      
      // Force a full refresh for first message case
      const forceRecalculation = event.detail?.forceTotalRecalculation === true;
      
      if (forceRecalculation) {
        handleBadgeUpdate({ 
          detail: { immediate: true, forceTotalRecalculation: true } 
        } as CustomEvent);
      } else {
        setTimeout(() => {
          setBadgeCount(totalUnreadCount);
          console.log("[HomeHeader] Badge count updated to:", totalUnreadCount);
        }, 50);
      }
    };
    
    const handleNotificationsUpdated = () => {
      setTimeout(() => {
        setNotificationsCount(notifications.length);
      }, 50);
    };
    
    // Add listeners for all relevant events that should trigger badge updates
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated as EventListener);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('conversation-opened', handleConversationOpened as EventListener);
    window.addEventListener('badge-refresh-required', handleBadgeUpdate as EventListener);
    window.addEventListener('local-read-status-change', handleBadgeUpdate as EventListener);
    window.addEventListener('club-message-received', handleBadgeUpdate as EventListener);
    window.addEventListener('unread-club-message', handleBadgeUpdate as EventListener);
    window.addEventListener('unread-dm-message', handleBadgeUpdate as EventListener);
    
    // Initial fetch to ensure we have the latest count
    fetchUnreadCounts();
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated as EventListener);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('conversation-opened', handleConversationOpened as EventListener);
      window.removeEventListener('badge-refresh-required', handleBadgeUpdate as EventListener);
      window.removeEventListener('local-read-status-change', handleBadgeUpdate as EventListener);
      window.removeEventListener('club-message-received', handleBadgeUpdate as EventListener);
      window.removeEventListener('unread-club-message', handleBadgeUpdate as EventListener);
      window.removeEventListener('unread-dm-message', handleBadgeUpdate as EventListener);
    };
  }, [notifications.length, totalUnreadCount, handleBadgeUpdate, fetchUnreadCounts, handleConversationOpened]);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  const handleConnectDevice = () => {
    navigate('/connect-device');
  };
  
  const handleChatOpen = () => {
    // When opening the chat drawer, fetch the latest unread counts
    fetchUnreadCounts().then(() => {
      // Then open the drawer
      open();
    });
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
          onClick={handleChatOpen} 
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
