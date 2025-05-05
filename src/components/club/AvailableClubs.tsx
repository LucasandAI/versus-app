import React, { useEffect, useState } from 'react';
import { Club, User } from '@/types';
import ClubCard from './ClubCard';
import { useClubJoin } from '@/hooks/home/useClubJoin';
import { Button } from '../ui/button';
import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useJoinRequest } from '@/hooks/club/useJoinRequest';
import { toast } from '@/hooks/use-toast';

interface AvailableClubsProps {
  title?: string;
  limitPreviewsTo?: number;
  filters?: {
    division?: string;
    minTier?: number;
    maxTier?: number;
    search?: string;
  };
  emptyMessage?: string;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ 
  title = "Available Clubs", 
  limitPreviewsTo = 3,
  filters = {},
  emptyMessage = "No clubs available. Create a new club or search for different criteria."
}) => {
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchParams] = useSearchParams();
  const { currentUser } = useApp();
  const { handleRequestToJoin } = useClubJoin();

  // Check if current user is already a member of a club
  const isMemberOfClub = useCallback((clubId: string) => {
    if (!currentUser || !currentUser.clubs || currentUser.clubs.length === 0) {
      return false;
    }
    return currentUser.clubs.some(club => club.id === clubId);
  }, [currentUser]);

  // Handle show more/less clubs
  const handleShowMoreToggle = () => {
    setShowAll(!showAll);
  };

  // Handle joining a club
  const handleJoin = async (clubId: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to join a club",
        variant: "destructive"
      });
      return;
    }
    
    // If the club is found in available clubs, get its name
    const clubToJoin = availableClubs.find(club => club.id === clubId);
    if (!clubToJoin) {
      toast({
        title: "Error",
        description: "Club not found",
        variant: "destructive"
      });
      return;
    }

    const joinRequest = useJoinRequest(clubId);
    
    // First check if the user already has a pending request
    const hasPending = await joinRequest.checkPendingRequest(currentUser.id);
    
    if (hasPending) {
      // Cancel the pending request
      await joinRequest.cancelJoinRequest(currentUser.id);
    } else {
      // Send a new request
      await joinRequest.sendJoinRequest(currentUser.id);
    }
    
    // Refresh the available clubs list
    fetchAvailableClubs();
  };

  // Fetch available clubs from Supabase
  const fetchAvailableClubs = useCallback(async () => {
    if (!currentUser) {
      setAvailableClubs([]);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('clubs')
        .select('id, name, logo, bio, division, tier, elite_points, member_count');
      
      // Apply any filters provided
      if (filters.division) {
        query = query.eq('division', filters.division);
      }
      
      if (typeof filters.minTier === 'number') {
        query = query.gte('tier', filters.minTier);
      }
      
      if (typeof filters.maxTier === 'number') {
        query = query.lte('tier', filters.maxTier);
      }
      
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching available clubs:', error);
        return;
      }
      
      if (!data) {
        setAvailableClubs([]);
        return;
      }

      // If we have clubs data, check for pending join requests
      const clubsWithRequestStatus = await Promise.all(
        data.map(async (club) => {
          // Check if user has a pending request for this club
          const { data: pendingRequest, error: requestError } = await supabase
            .from('club_requests')
            .select('status')
            .eq('user_id', currentUser.id)
            .eq('club_id', club.id)
            .eq('status', 'PENDING')
            .maybeSingle();
            
          return {
            ...club,
            hasPendingRequest: !!pendingRequest,
            isPreviewClub: true,
            members: [] // We don't have members here, but need it to match Club type
          };
        })
      );
      
      // Now we need to filter out clubs the user is already in
      const userClubIds = currentUser.clubs.map(club => club.id);
      const availableClubsData = clubsWithRequestStatus.filter(club => 
        !userClubIds.includes(club.id)
      );
      
      setAvailableClubs(availableClubsData);
      
    } catch (error) {
      console.error('Error in fetchAvailableClubs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, filters]);

  useEffect(() => {
    fetchAvailableClubs();
  }, [fetchAvailableClubs]);

  // Determine which clubs to display based on showAll flag
  const clubsToDisplay = showAll ? availableClubs : availableClubs.slice(0, limitPreviewsTo);

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {isLoading ? (
        <p>Loading clubs...</p>
      ) : clubsToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubsToDisplay.map((club) => (
            <ClubCard key={club.id} club={club} isPreviewClub={true}>
              {currentUser && !isMemberOfClub(club.id) && (
                <Button onClick={() => handleJoin(club.id)}>
                  {club.hasPendingRequest ? 'Cancel Request' : 'Request to Join'}
                </Button>
              )}
            </ClubCard>
          ))}
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}
      {availableClubs.length > limitPreviewsTo && (
        <button className="mt-4 text-primary hover:underline" onClick={handleShowMoreToggle}>
          {showAll ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

export default AvailableClubs;
