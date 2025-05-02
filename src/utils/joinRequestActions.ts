
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Accepts a join request by:
 * 1. Querying the club_requests table
 * 2. Adding the user to club_members
 * 3. Updating request status to accepted
 * 4. Deleting the notification
 */
export const acceptJoinRequestFromNotification = async (
  userId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing accept request:', { userId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .single();
      
    if (requestError || !requestData) {
      console.error('[joinRequestActions] Error finding request:', requestError);
      toast.error("Join request not found or already processed");
      return false;
    }
    
    // Check if the club is full (max 5 members)
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();
      
    if (clubError) {
      console.error('[joinRequestActions] Error checking club:', clubError);
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
      console.error('[joinRequestActions] Error adding user to club:', joinError);
      throw joinError;
    }
    
    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'accepted' })
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (updateError) {
      console.error('[joinRequestActions] Error updating request status:', updateError);
      throw updateError;
    }
    
    // Delete the notification
    // This is now handled by DB triggers, but we'll delete it anyway to be sure
    await deleteRelatedNotification(userId, clubId, 'join_request');
    
    // Refresh UI state
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestActions] Error accepting request:', error);
    toast.error("Failed to accept join request");
    return false;
  }
};

/**
 * Denies a join request by:
 * 1. Querying the club_requests table
 * 2. Deleting the request
 * 3. Deleting the notification
 */
export const denyJoinRequestFromNotification = async (
  userId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing deny request:', { userId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .single();
      
    if (requestError || !requestData) {
      console.error('[joinRequestActions] Error finding request:', requestError);
      toast.error("Join request not found or already processed");
      return false;
    }
    
    // Delete the request
    const { error: deleteError } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      console.error('[joinRequestActions] Error deleting request:', deleteError);
      throw deleteError;
    }
    
    // Delete the notification
    await deleteRelatedNotification(userId, clubId, 'join_request');
    
    // Refresh UI state
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestActions] Error denying request:', error);
    toast.error("Failed to deny join request");
    return false;
  }
};

/**
 * Helper function to delete notifications related to a join request
 */
const deleteRelatedNotification = async (
  userId: string,
  clubId: string,
  type: string
): Promise<void> => {
  try {
    // Delete the notification for this specific request
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('club_id', clubId)
      .eq('type', type)
      .eq('user_id', userId);
      
    if (error) {
      console.error('[joinRequestActions] Error deleting notification:', error);
    }
  } catch (error) {
    console.error('[joinRequestActions] Error in deleteRelatedNotification:', error);
  }
};
