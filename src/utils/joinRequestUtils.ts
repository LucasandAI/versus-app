
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const acceptJoinRequest = async (userId: string, clubId: string, userName: string): Promise<boolean> => {
  try {
    // Update the request status
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('user_id', userId)
      .eq('club_id', clubId);

    if (updateError) {
      console.error('[acceptJoinRequest] Error updating request status:', updateError);
      return false;
    }

    // Add the user to the club
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        is_admin: false
      });

    if (memberError) {
      console.error('[acceptJoinRequest] Error adding user to club:', memberError);
      return false;
    }

    // Show success toast
    toast({
      title: "Request Accepted",
      description: `${userName} has been added to the club.`
    });

    // Dispatch event to refresh user data
    window.dispatchEvent(new Event('userDataUpdated'));
    
    return true;
  } catch (error) {
    console.error('[acceptJoinRequest] Error:', error);
    return false;
  }
};

export const denyJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    // Update the request status to 'ERROR' (which maps to 'rejected' in the UI)
    const { error } = await supabase
      .from('club_requests')
      .update({ status: 'ERROR' }) // Using 'ERROR' to match the database enum
      .eq('user_id', userId)
      .eq('club_id', clubId);

    if (error) {
      console.error('[denyJoinRequest] Error updating request status:', error);
      return false;
    }

    // Show success toast
    toast({
      title: "Request Denied",
      description: "The join request has been denied."
    });
    
    return true;
  } catch (error) {
    console.error('[denyJoinRequest] Error:', error);
    return false;
  }
};
