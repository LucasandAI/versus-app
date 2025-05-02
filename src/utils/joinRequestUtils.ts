
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Accepts a join request from a user to a club.
 */
export const acceptJoinRequest = async (
  userId: string,
  clubId: string,
  userName: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestUtils] Accepting join request:', { userId, clubId });
    
    // Check if the club is full (max 5 members)
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();
      
    if (clubError) {
      throw clubError;
    }
    
    if (clubData && clubData.member_count >= 5) {
      toast.error("Club is full (5/5 members). Cannot add more members.");
      return false;
    }
    
    // Add the user to club_members
    const { error: joinError } = await supabase
      .from('club_members')
      .insert({
        user_id: userId,
        club_id: clubId,
        is_admin: false
      });
      
    if (joinError) {
      throw joinError;
    }
    
    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'accepted' })
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (updateError) {
      throw updateError;
    }
    
    // Success notification
    toast.success(`${userName || 'User'} has been added to the club`);
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
      detail: { clubId, userId, action: 'add' } 
    }));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestUtils] Error accepting request:', error);
    toast.error("Failed to accept join request");
    return false;
  }
};

/**
 * Denies a join request from a user to a club.
 */
export const denyJoinRequest = async (
  userId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestUtils] Denying join request:', { userId, clubId });
    
    // Delete the request
    const { error: deleteError } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      throw deleteError;
    }
    
    // Success notification
    toast.success("Join request denied");
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
      detail: { clubId, userId, action: 'reject' } 
    }));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestUtils] Error denying request:', error);
    toast.error("Failed to deny join request");
    return false;
  }
};
