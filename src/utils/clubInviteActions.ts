
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Accept an invite from a notification
export const acceptClubInvite = async (
  notificationId: string, 
  clubId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log('[acceptClubInvite] Accepting invite:', { notificationId, clubId, userId });
    
    // Check if club is full before accepting
    const { data: membersCount, error: countError } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);
      
    if (countError) {
      console.error('[acceptClubInvite] Error checking club capacity:', countError);
      toast.error('Could not verify club capacity');
      return false;
    }
    
    if (Array.isArray(membersCount) && membersCount.length >= 5) {
      toast.error('This club is full (5/5 members)');
      return false;
    }
    
    // Use a transaction to handle all operations atomically
    const { data, error } = await supabase.rpc('accept_club_invite', {
      p_notification_id: notificationId,
      p_club_id: clubId,
      p_user_id: userId
    });
    
    // If the RPC call fails, try the legacy approach
    if (error) {
      console.error('[acceptClubInvite] RPC error:', error);
      console.log('[acceptClubInvite] Falling back to standard operations');
      
      // Start with adding the user to the club
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
      
      // Update invite status
      const { error: inviteError } = await supabase
        .from('club_invites')
        .update({ status: 'accepted' })
        .eq('club_id', clubId)
        .eq('user_id', userId);
        
      if (inviteError) {
        console.error('[acceptClubInvite] Error updating invite status:', inviteError);
      }
      
      // Delete the notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (notificationError) {
        console.error('[acceptClubInvite] Error deleting notification:', notificationError);
      }
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
    
    // Use a transaction to handle all operations atomically
    const { data, error } = await supabase.rpc('deny_club_invite', {
      p_notification_id: notificationId,
      p_club_id: clubId,
      p_user_id: userId
    });
    
    // If the RPC call fails, try the legacy approach
    if (error) {
      console.error('[denyClubInvite] RPC error:', error);
      console.log('[denyClubInvite] Falling back to standard operations');
      
      // Update invite status
      const { error: inviteError } = await supabase
        .from('club_invites')
        .update({ status: 'rejected' })
        .eq('club_id', clubId)
        .eq('user_id', userId);
        
      if (inviteError) {
        console.error('[denyClubInvite] Error updating invite status:', inviteError);
      }
      
      // Delete the notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (notificationError) {
        console.error('[denyClubInvite] Error deleting notification:', notificationError);
        toast.error('Failed to deny invitation');
        return false;
      }
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
    const { data: membersCount, error: countError } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);
      
    if (countError) {
      console.error('[sendClubInvite] Error checking club capacity:', countError);
      toast.error('Could not verify club capacity');
      return false;
    }
    
    if (Array.isArray(membersCount) && membersCount.length >= 5) {
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
    const { data, error, count } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);
      
    if (error) {
      console.error('[isClubFull] Error checking club capacity:', error);
      return false; // Default to false if we can't verify
    }
    
    return count !== null && count >= 5;
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
