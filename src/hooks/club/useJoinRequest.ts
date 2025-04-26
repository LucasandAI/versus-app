
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useJoinRequest = (clubId: string) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const checkPendingRequest = async (userId: string) => {
    const { data, error } = await supabase
      .from('club_requests')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking pending request:', error);
    }

    setHasPendingRequest(!!data);
    return !!data;
  };

  const sendJoinRequest = async (userId: string) => {
    setIsRequesting(true);
    try {
      const { error } = await supabase
        .from('club_requests')
        .insert([{
          user_id: userId,
          club_id: clubId,
          status: 'pending'
        }]);

      if (error) throw error;

      setHasPendingRequest(true);
      toast({
        title: "Request sent",
        description: "Your request to join has been sent to the club admins"
      });
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Could not send join request",
        variant: "destructive"
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    isRequesting,
    hasPendingRequest,
    sendJoinRequest,
    checkPendingRequest
  };
};
