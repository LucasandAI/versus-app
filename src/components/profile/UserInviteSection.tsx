
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from 'lucide-react';
import ClubInviteDialog from '../admin/ClubInviteDialog';
import { User, Club } from '@/types';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

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
  const { unhideConversation } = useHiddenDMs();

  if (isCurrentUserProfile) return null;

  const handleMessageClick = () => {
    // Unhide the conversation if it was hidden
    unhideConversation(selectedUser.id);
    
    // Open the chat drawer first
    openChatDrawer();
    
    // Small delay to ensure drawer is open before switching tabs
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
    }, 100);
    
    console.log('Message button clicked for user:', selectedUser.name);
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
