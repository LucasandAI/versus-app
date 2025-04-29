
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from 'lucide-react';
import ClubInviteDialog from '../admin/ClubInviteDialog';
import { User, Club } from '@/types';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useConversations } from '@/hooks/chat/dm/useConversations';

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
  const { currentUser } = useApp();
  const { fetchConversations } = useConversations([]); // Get fetchConversations but don't fetch on mount

  if (isCurrentUserProfile) return null;

  const handleMessageClick = async () => {
    if (!currentUser?.id) {
      console.error('Cannot message: Current user not available');
      return;
    }

    try {
      // First check if a conversation already exists between these users
      const { data: existingConversations, error: convError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${selectedUser.id}),and(user1_id.eq.${selectedUser.id},user2_id.eq.${currentUser.id})`)
        .limit(1);

      if (convError) {
        console.error('Error checking existing conversations:', convError);
        return;
      }

      let conversationId: string;

      // If no conversation exists, create one
      if (!existingConversations || existingConversations.length === 0) {
        const { data: newConv, error: createError } = await supabase
          .from('direct_conversations')
          .insert([
            { user1_id: currentUser.id, user2_id: selectedUser.id }
          ])
          .select('id')
          .single();

        if (createError || !newConv) {
          console.error('Error creating conversation:', createError);
          return;
        }

        conversationId = newConv.id;
      } else {
        conversationId = existingConversations[0].id;
      }
      
      // Fetch conversations before opening chat drawer to ensure data is fresh
      await fetchConversations();

      // Open the chat drawer first
      openChatDrawer();
      
      // Small delay to ensure drawer is open before dispatching the event
      setTimeout(() => {
        // Dispatch custom event to open DM with this user
        const event = new CustomEvent('openDirectMessage', {
          detail: {
            userId: selectedUser.id,
            userName: selectedUser.name,
            userAvatar: selectedUser.avatar,
            conversationId: conversationId
          }
        });
        window.dispatchEvent(event);
        console.log('Message button clicked for user:', selectedUser.name, 'Event dispatched with conversation ID:', conversationId);
      }, 100);
    } catch (error) {
      console.error('Error handling message click:', error);
    }
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
