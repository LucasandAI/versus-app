
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useJoinRequest = (clubId: string) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { currentUser } = useApp();

  useEffect(() => {
    if (currentUser) {
      checkPendingRequest(currentUser.id);
    }
  }, [currentUser, clubId]);

  const checkPendingRequest = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending request:', error);
      }

      setHasPendingRequest(!!data);
      return !!data;
    } catch (error) {
      console.error('Error checking pending request:', error);
      return false;
    }
  };

  const sendJoinRequest = async (userId: string) => {
    setIsRequesting(true);
    try {
      const { error } = await supabase
        .from('club_requests')
        .insert([{
          user_id: userId,
          club_id: clubId
        }]);

      if (error) throw error;

      setHasPendingRequest(true);
      toast({
        title: "Request Sent",
        description: "Your request to join has been sent to the club admins"
      });
      
      // Create notification for club admins
      try {
        // Get club admins
        const { data: admins } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', clubId)
          .eq('is_admin', true);
          
        if (admins && admins.length > 0) {
          // Get user information for the notification
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();
            
          // Get club information
          const { data: clubData } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .single();
            
          // Create notifications for each admin
          for (const admin of admins) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              club_id: clubId,
              type: 'join_request',
              message: `${userData?.name || 'Someone'} has requested to join ${clubData?.name || 'your club'}.`,
              read: false
            });
          }
        }
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // We don't want to fail the whole request if notifications fail
      }
      
      return true;
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Could not send join request",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const cancelJoinRequest = async (userId: string) => {
    setIsRequesting(true);
    try {
      const { error } = await supabase
        .from('club_requests')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) throw error;

      setHasPendingRequest(false);
      toast({
        title: "Request Canceled",
        description: "Your join request has been canceled"
      });
      return true;
    } catch (error) {
      console.error('Error canceling join request:', error);
      toast({
        title: "Error",
        description: "Could not cancel join request",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    isRequesting,
    hasPendingRequest,
    sendJoinRequest,
    cancelJoinRequest,
    checkPendingRequest
  };
};
