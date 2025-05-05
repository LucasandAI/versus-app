
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useMatchScheduler = () => {
  const [isCreatingMatches, setIsCreatingMatches] = useState(false);
  const [isEndingMatches, setIsEndingMatches] = useState(false);
  const { toast } = useToast();

  // Manually trigger match creation (mainly for testing/admin purposes)
  const createMatches = async () => {
    try {
      setIsCreatingMatches(true);
      
      const { data, error } = await supabase.functions.invoke('create-matches', {
        method: 'POST',
      });
      
      if (error) throw error;
      
      toast({
        title: 'Match Creation',
        description: data.message || `Created ${data.matchesCreated} new matches`,
      });
      
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('newMatchWeekStarted'));
      
      return data;
    } catch (error) {
      console.error('[useMatchScheduler] Error creating matches:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create matches',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingMatches(false);
    }
  };
  
  // Manually trigger ending of expired matches
  const endMatches = async () => {
    try {
      setIsEndingMatches(true);
      
      const { data, error } = await supabase.functions.invoke('end-matches', {
        method: 'POST',
      });
      
      if (error) throw error;
      
      toast({
        title: 'Matches Ended',
        description: data.message || `Ended ${data.matchesEnded} expired matches`,
      });
      
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('matchEnded'));
      
      return data;
    } catch (error) {
      console.error('[useMatchScheduler] Error ending matches:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to end matches',
        variant: 'destructive',
      });
    } finally {
      setIsEndingMatches(false);
    }
  };
  
  return {
    createMatches,
    endMatches,
    isCreatingMatches,
    isEndingMatches
  };
};
