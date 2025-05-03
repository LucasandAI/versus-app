
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkClubCapacity } from './notifications/clubCapacity';

// Accept an invite from a notification
export const acceptClubInvite = async (
  notificationId: string, 
  clubId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log('[acceptClubInvite] Accepting invite:', { notificationId, clubId, userId });
    
    // Check if club is full before accepting
    const { isFull, memberCount } = await checkClubCapacity(clubId);
      
    if (isFull) {
      toast.error('This club is full (5/5 members)');
      return false;
    }
    
    // Since we can't use RPC, we'll perform operations directly
    // Start a transaction using batched operations
    
    // 1. Add the user to the club
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        is_admin: false
      });
      
    if (memberError) {
      console.error('[acceptClubInvite] Error adding member:', memberError);
      toast.error('Could not join the club');
      return false;
    }
    
    // 2. Update invite status
    const { error: inviteError } = await supabase
      .from('club_invites')
      .update({ status: 'accepted' })
      .eq('club_id', clubId)
      .eq('user_id', userId);
      
    if (inviteError) {
      console.error('[acceptClubInvite] Error updating invite status:', inviteError);
    }
    
    // 3. Delete the invite after it's been accepted
    const { error: deleteInviteError } = await supabase
      .from('club_invites')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);
      
    if (deleteInviteError) {
      console.error('[acceptClubInvite] Error deleting invite:', deleteInviteError);
    }
    
    // 4. Delete the notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (notificationError) {
      console.error('[acceptClubInvite] Error deleting notification:', notificationError);
    }
    
    // Trigger updates to refresh UI components
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
      detail: { clubId } 
    }));
    
    toast.success('You have joined the club!');
    return true;
    
  } catch (error) {
    console.error('[acceptClubInvite] Unexpected error:', error);
    toast.error('Failed to join club');
    return false;
  }
};

// Deny a club invite from a notification
export const denyClubInvite = async (
  notificationId: string, 
  clubId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log('[denyClubInvite] Denying invite:', { notificationId, clubId, userId });
    
    // Since we can't use RPC, we'll perform operations directly
    
    // 1. Update invite status
    const { error: inviteError } = await supabase
      .from('club_invites')
      .update({ status: 'rejected' })
      .eq('club_id', clubId)
      .eq('user_id', userId);
      
    if (inviteError) {
      console.error('[denyClubInvite] Error updating invite status:', inviteError);
    }
    
    // 2. Delete the invite after it's been rejected
    const { error: deleteInviteError } = await supabase
      .from('club_invites')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);
      
    if (deleteInviteError) {
      console.error('[denyClubInvite] Error deleting invite:', deleteInviteError);
    }
    
    // 3. Delete the notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (notificationError) {
      console.error('[denyClubInvite] Error deleting notification:', notificationError);
      toast.error('Failed to deny invitation');
      return false;
    }
    
    // Trigger updates to refresh UI components
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    toast.success('Invitation declined');
    return true;
    
  } catch (error) {
    console.error('[denyClubInvite] Unexpected error:', error);
    toast.error('Failed to decline invitation');
    return false;
  }
};

// Send an invite to a user
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
    
    // Use upsert to handle duplicate invites
    const { error: inviteError } = await supabase
      .from('club_invites')
      .upsert({
        club_id: clubId,
        user_id: userId,
        status: 'pending'
      }, { 
        onConflict: 'club_id,user_id',
        ignoreDuplicates: false 
      });
      
    if (inviteError) {
      console.error('[sendClubInvite] Error creating/updating invite:', inviteError);
      toast.error('Failed to send invitation');
      return false;
    }
    
    // Create or replace notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .upsert({
        user_id: userId,
        club_id: clubId,
        type: 'invite',
        message: `You've been invited to join ${clubName}`,
        read: false,
        data: {
          clubId,
          clubName,
          inviterName: 'Admin' // This should ideally be the current user's name
        }
      }, {
        onConflict: 'user_id,club_id,type',
        ignoreDuplicates: false 
      });
      
    if (notificationError) {
      console.error('[sendClubInvite] Error creating notification:', notificationError);
      toast.error('Failed to notify user');
      return false;
    }
    
    toast.success(`Invitation sent to ${userName}`);
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
