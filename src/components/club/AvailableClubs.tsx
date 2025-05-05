import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { hasPendingJoinRequest } from '@/utils/notifications/joinRequestQueries';
import { supabase } from '@/integrations/supabase/client';

interface AvailableClubsProps {
  clubs: Club[];
  isLoading?: boolean;
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ clubs, isLoading, onRequestJoin }) => {
  const { currentUser } = useApp();
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkPending = async () => {
      if (!currentUser) return;

      const pending: Record<string, boolean> = {};
      for (const club of clubs) {
        pending[club.id] = await hasPendingJoinRequest(currentUser.id, club.id);
      }
      setPendingRequests(pending);
    };

    checkPending();
  }, [currentUser, clubs]);

  const handleJoinRequest = async (clubId: string, clubName: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You must be logged in to request to join a club.",
        variant: "destructive",
      });
      return;
    }

    // Optimistically update the UI
    setPendingRequests(prev => ({ ...prev, [clubId]: true }));

    try {
      // Check for existing request with status 'pending' (lowercase)
      const { data: existingRequest } = await supabase
        .from('club_requests')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('club_id', clubId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: "Pending Request",
          description: "You already have a pending request for this club.",
        });
        return;
      }

      onRequestJoin(clubId, clubName);
      toast({
        title: "Request Sent",
        description: `Your request to join ${clubName} has been sent.`,
      });
    } catch (error) {
      console.error("Error sending join request:", error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update on error
      setPendingRequests(prev => ({ ...prev, [clubId]: false }));
    }
  };

  if (isLoading) {
    return <p>Loading available clubs...</p>;
  }

  if (!clubs || clubs.length === 0) {
    return <p>No available clubs at the moment.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {clubs.map((club) => (
        <div key={club.id} className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-lg">{club.name}</h3>
          <p className="text-gray-500 text-sm">
            {club.members.length} / 5 Members
          </p>
          <Button
            className="w-full mt-3"
            onClick={() => handleJoinRequest(club.id, club.name)}
            disabled={pendingRequests[club.id] || isLoading}
          >
            {pendingRequests[club.id] ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Request to Join
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default AvailableClubs;
