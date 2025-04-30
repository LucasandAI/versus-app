
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { handleNotification } from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

export const useClubActions = (club: Club) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();

  const handleLeaveClub = async (newAdminId?: string) => {
    if (!currentUser || !currentUser.clubs.some(c => c.id === club.id)) return;
    
    try {
      // Remove the user from the club in Supabase
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', club.id)
        .eq('user_id', currentUser.id);
      
      if (error) {
        throw new Error(`Failed to leave club: ${error.message}`);
      }
      
      // Handle admin transfer if specified
      if (newAdminId && currentUser.id !== newAdminId) {
        const { error: adminError } = await supabase
          .from('club_members')
          .update({ is_admin: true })
          .eq('club_id', club.id)
          .eq('user_id', newAdminId);
        
        if (adminError) {
          console.error('Error transferring admin rights:', adminError);
        }
      }

      // Update local state after successful database update
      const updatedClub = { ...club };
      if (newAdminId) {
        updatedClub.members = club.members.map(member => ({
          ...member,
          isAdmin: member.id === newAdminId
        }));
      }
      
      updatedClub.members = updatedClub.members.filter(member => member.id !== currentUser.id);
      
      const updatedClubs = currentUser.clubs.filter(c => c.id !== club.id);
      const updatedUser = {
        ...currentUser,
        clubs: updatedClubs
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setSelectedClub(null);
      
      toast({
        title: "Left Club",
        description: `You have successfully left ${club.name}.`
      });
      
      setCurrentView('home');
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
    } catch (error) {
      console.error('Error leaving club:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave club",
        variant: "destructive"
      });
    }
  };

  const handleMakeMemberAdmin = async (memberId: string, memberName: string) => {
    if (!club || !club.id) return false;
    
    try {
      // Update member to be admin in Supabase
      const { error } = await supabase
        .from('club_members')
        .update({ is_admin: true })
        .eq('club_id', club.id)
        .eq('user_id', memberId);

      if (error) {
        throw new Error(`Failed to make member an admin: ${error.message}`);
      }

      toast({
        title: "Admin Rights Granted",
        description: `${memberName} is now an admin of the club.`
      });
      
      // Trigger refresh to update UI
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error making member admin:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin status",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleJoinFromInvite = async () => {
    if (!club || !currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      try {
        // Add the member to the club in Supabase
        const { error } = await supabase
          .from('club_members')
          .insert({
            club_id: club.id,
            user_id: currentUser.id,
            is_admin: false
          });
        
        if (error) {
          throw new Error(`Failed to join club: ${error.message}`);
        }
        
        // Update the invitation status
        if (invitation.id) {
          await supabase
            .from('club_invites')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);
        }
        
        handleNotification(invitation.id, 'delete');
        
        // Update local state
        window.dispatchEvent(new CustomEvent('userDataUpdated'));
        
      } catch (error) {
        console.error('Error joining club:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to join club",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeclineInvite = async () => {
    if (!club) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      try {
        // Update the invitation status
        if (invitation.id) {
          await supabase
            .from('club_invites')
            .update({ status: 'rejected' })
            .eq('id', invitation.id);
        }
        
        handleNotification(invitation.id, 'delete');
        
        toast({
          title: "Invite Declined",
          description: `You have declined the invitation to join ${club.name}.`
        });
      } catch (error) {
        console.error('Error declining invitation:', error);
      }
    }
  };

  return {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite,
    handleMakeMemberAdmin
  };
};
