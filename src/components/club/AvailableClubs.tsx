import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { hasPendingJoinRequest } from '@/utils/notifications/joinRequestQueries';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AvailableClubsProps {
  clubs: Club[];
  onRequestJoin: (clubId: string) => Promise<void>;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ clubs, onRequestJoin }) => {
  const { currentUser } = useApp();
  const [pendingRequests, setPendingRequests] = useState<Map<string, boolean>>(new Map());
  
  useEffect(() => {
    const initializePendingRequests = async () => {
      if (!currentUser || !clubs) return;
      
      const initialPendingRequests = new Map<string, boolean>();
      
      for (const club of clubs) {
        const hasPending = await hasPendingJoinRequest(currentUser.id, club.id);
        initialPendingRequests.set(club.id, hasPending);
      }
      
      setPendingRequests(initialPendingRequests);
    };
    
    initializePendingRequests();
  }, [currentUser, clubs]);

  const handleRequestJoin = async (clubId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to request to join a club.');
      return;
    }

    setPendingRequests(prev => new Map(prev).set(clubId, true));
    await onRequestJoin(clubId);
  };

  // Check if user has any pending requests to these clubs
  useEffect(() => {
    const checkJoinRequests = async () => {
      if (!currentUser || availableClubs.length === 0) return;

      try {
        // Get all pending requests for this user
        const { data, error } = await supabase
          .from('club_requests')
          .select('club_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'PENDING');

        if (error) {
          console.error('[AvailableClubs] Error fetching join requests:', error);
          return;
        }

        if (data && data.length > 0) {
          // Create a map for faster lookup
          const requestMap = new Map();
          data.forEach(request => requestMap.set(request.club_id, true));
          
          // Update pending states based on requests
          const updatedPendingStates = new Map(pendingRequests);
          
          availableClubs.forEach(club => {
            if (requestMap.has(club.id)) {
              updatedPendingStates.set(club.id, true);
            }
          });
          
          setPendingRequests(updatedPendingStates);
        }
      } catch (error) {
        console.error('[AvailableClubs] Error checking join requests:', error);
      }
    };

    checkJoinRequests();
  }, [availableClubs, currentUser]);

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-sm mb-2">Available Clubs</h4>
      {clubs && clubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white rounded-md shadow-sm p-4">
              <h5 className="font-medium text-sm">{club.name}</h5>
              <p className="text-xs text-gray-500">{club.members.length}/5 Members</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => handleRequestJoin(club.id)}
                disabled={pendingRequests.get(club.id) === true}
              >
                {pendingRequests.get(club.id) === true ? 'Request Sent' : 'Request to Join'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No clubs available. Create one to get started!</p>
      )}
    </div>
  );
};

export default AvailableClubs;
