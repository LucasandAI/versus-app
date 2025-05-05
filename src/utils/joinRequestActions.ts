import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkClubCapacity } from './notifications/clubCapacity';
import { normalizeStatus } from '@/types/request-status';

/**
 * Accepts a join request by:
 * 1. Querying the club_requests table
 * 2. Adding the user to club_members
 * 3. Updating request status to accepted
 * 4. Deleting the notification
 */
export const acceptJoinRequestFromNotification = async (
  requesterId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing accept request:', { requesterId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', requesterId)  // Using requesterId (the person who requested to join)
      .eq('club_id', clubId)
      .eq('status', 'PENDING')
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
        user_id: requesterId,
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
      .update({ status: 'ACCEPTED' })
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (updateError) {
      console.error('[joinRequestActions] Error updating request status:', updateError);
      throw updateError;
    }
    
    // Delete notifications related to this join request
    await deleteRelatedNotification(requesterId, clubId, 'join_request');
    
    // Show success toast
    toast.success("User has been added to the club");
    
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
  requesterId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing deny request:', { requesterId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', requesterId)  // Using requesterId (the person who requested to join)
      .eq('club_id', clubId)
      .eq('status', 'PENDING')
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
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      console.error('[joinRequestActions] Error deleting request:', deleteError);
      throw deleteError;
    }
    
    // Delete the notification
    await deleteRelatedNotification(requesterId, clubId, 'join_request');
    
    // Show success toast
    toast.success("Join request denied");
    
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
 * This works for both admin notifications and user notifications
 */
const deleteRelatedNotification = async (
  requesterId: string,
  clubId: string,
  type: 'join_request' | 'invite' | 'request_accepted'
): Promise<void> => {
  try {
    console.log('[joinRequestActions] Looking for notifications to delete:', { 
      requesterId, clubId, type 
    });
    
    // First, get notifications related to this request
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, data')
      .eq('club_id', clubId)
      .eq('type', type);
    
    if (fetchError) {
      console.error('[joinRequestActions] Error fetching notifications:', fetchError);
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('[joinRequestActions] No notifications found');
      return;
    }
    
    console.log('[joinRequestActions] Found notifications:', notifications);
    
    // Filter notifications that match our requester ID (either in the data field or by user_id)
    const matchingNotifications = notifications.filter(notification => {
      // For join requests sent to admins, the data contains the requester's ID
      if (notification.data && typeof notification.data === 'object') {
        const data = notification.data as Record<string, any>;
        if (
          (data.requesterId && data.requesterId === requesterId) || 
          (data.userId && data.userId === requesterId)
        ) {
          return true;
        }
      }
      
      // For other notification types where the requester is the notification recipient
      return notification.user_id === requesterId;
    });
    
    if (matchingNotifications.length === 0) {
      console.log('[joinRequestActions] No matching notifications found');
      return;
    }
    
    // Delete the matched notifications
    const notificationIds = matchingNotifications.map(n => n.id);
    console.log('[joinRequestActions] Deleting notifications with IDs:', notificationIds);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);
      
    if (error) {
      console.error('[joinRequestActions] Error deleting notifications:', error);
    } else {
      console.log('[joinRequestActions] Successfully deleted notifications');
    }
  } catch (error) {
    console.error('[joinRequestActions] Error in deleteRelatedNotification:', error);
  }
};

/**
 * Send an invite to a user
 */
export const sendClubInvite = async (
  clubId: string,
  clubName: string,
  userId: string,
  userName: string
): Promise<boolean> => {
  try {
    console.log('[sendClubInvite] Sending invite:', { clubId, userId, userName });
    
    // Check if club is already full
    const { isFull } = await checkClubCapacity(clubId);
      
    if (isFull) {
      toast.error('This club is already full (5/5 members)');
      return false;
    }
    
    // Check if user is already a member of the club
    const { data: existingMember, error: memberError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (memberError) {
      console.error('[sendClubInvite] Error checking membership:', memberError);
    }
    
    if (existingMember) {
      toast.error(`${userName} is already a member of this club`);
      return false;
    }

    // Get current user to use as inviter
    const { data: { user } } = await supabase.auth.getUser();
    const inviterName = user ? user.email?.split('@')[0] || 'Admin' : 'Admin';

    // Clean up any existing invites for this user/club combination regardless of status
    // This allows re-inviting users who previously rejected invitations
    try {
      const { error: deleteInviteError } = await supabase
        .from('club_invites')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);
        
      if (deleteInviteError) {
        console.log('[sendClubInvite] Error cleaning up old invites:', deleteInviteError);
      }
    } catch (error) {
      console.error('[sendClubInvite] Failed to clean up old invites:', error);
      // Continue execution, this is not critical
    }
    
    // Create a new invite with pending status
    const { error: inviteError } = await supabase
      .from('club_invites')
      .insert({
        club_id: clubId,
        user_id: userId,
        status: 'pending'
      });
      
    if (inviteError) {
      console.error('[sendClubInvite] Error creating invite:', inviteError);
      toast.error('Failed to send invitation');
      return false;
    }
    
    // Delete any existing notifications for this club/user/type combination
    // This ensures we'll create a fresh notification
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .eq('type', 'invite' as const);
        
      console.log('[sendClubInvite] Cleaned up old notifications');
    } catch (error) {
      console.log('[sendClubInvite] Error cleaning up old notifications:', error);
      // Continue execution, this is not critical
    }
    
    // Now create a fresh notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        club_id: clubId,
        type: 'invite' as const, // <-- Use type assertion here to make TypeScript happy
        message: `You've been invited to join ${clubName}`,
        read: false,
        data: {
          clubId,
          clubName,
          inviterName
        }
      });
      
    if (notificationError) {
      console.error('[sendClubInvite] Error creating notification:', notificationError);
      toast.error('Failed to notify user');
      return false;
    }
    
    toast.success(`Invitation sent to ${userName}`);
    
    // Trigger notification update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
    
  } catch (error) {
    console.error('[sendClubInvite] Unexpected error:', error);
    toast.error('Failed to send invitation');
    return false;
  }
};

// Check if a club is full
export const isClubFull = async (clubId: string): Promise<boolean> => {
  try {
    const { isFull } = await checkClubCapacity(clubId);
    return isFull;
  } catch (error) {
    console.error('[isClubFull] Unexpected error:', error);
    return false;
  }
};

// Check if user is already a member of the club
export const isUserClubMember = async (clubId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();
      
    return !error && data !== null;
  } catch (error) {
    console.error('[isUserClubMember] Unexpected error:', error);
    return false;
  }
};
