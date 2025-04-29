
import React, { useContext } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from 'lucide-react';
import ClubInviteDialog from '../admin/ClubInviteDialog';
import { User, Club } from '@/types';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useDirectConversations } from '@/hooks/chat/dm/useDirectConversations';

interface UserInviteSectionProps {
  showInviteButton: boolean;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  selectedUser: User;
  adminClubs: Club[];
  isCurrentUserProfile: boolean;
}

const UserInviteSection: React.FC<UserInviteSectionProps> = ({
  showInviteButton,
  inviteDialogOpen,
  setInviteDialogOpen,
  selectedUser,
  adminClubs,
  isCurrentUserProfile
}) => {
  const { open: openChatDrawer } = useChatDrawerGlobal();
  const { fetchConversations } = useDirectConversations();

  if (isCurrentUserProfile) return null;

  const handleMessageClick = async () => {
    // Open the chat drawer first
    openChatDrawer();
    
    // Small delay to ensure drawer is open before dispatching the event
    setTimeout(() => {
      // Dispatch custom event to open DM with this user
      const event = new CustomEvent('openDirectMessage', {
        detail: {
          userId: selectedUser.id,
          userName: selectedUser.name,
          userAvatar: selectedUser.avatar
        }
      });
      window.dispatchEvent(event);
      console.log('Message button clicked for user:', selectedUser.name, 'Event dispatched');
    }, 100);
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={handleMessageClick}
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Button>
      
      {showInviteButton && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite to Club
          </Button>
          
          <ClubInviteDialog 
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            user={selectedUser}
            adminClubs={adminClubs}
          />
        </>
      )}
    </div>
  );
};

export default UserInviteSection;
