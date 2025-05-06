
import { useState } from 'react';
import { Club, User } from '@/types';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

interface ClubData {
  name: string;
  logo?: string;
  bio?: string;
}

export const useClubManagement = (
  currentUser: User | null, 
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  const createClub = async (clubData: ClubData): Promise<Club | null> => {
    if (!currentUser) {
      toast({
        title: "Error creating club",
        description: "You must be logged in to create a club",
        variant: "destructive"
      });
      return null;
    }
    
    if (isCreatingClub) {
      console.log('[useClubManagement] Club creation already in progress');
      return null;
    }
    
    setIsCreatingClub(true);
    
    try {
      console.log('[useClubManagement] Creating club:', clubData);
      
      // Create a slug from the club name
      const slug = clubData.name.toLowerCase().replace(/\s+/g, '-');
      
      // Insert the new club
      const { data, error: clubError } = await safeSupabase
        .from('clubs')
        .insert({
          name: clubData.name,
          logo: clubData.logo || '/placeholder.svg',
          division: 'bronze',
          tier: 5,
          elite_points: 0,
          created_by: currentUser.id,
          bio: clubData.bio || `Welcome to ${clubData.name}! We're a group of passionate runners looking to challenge ourselves and improve together.`,
          slug: slug
        })
        .select()
        .single();

      if (clubError || !data) {
        console.error('[useClubManagement] Error creating club:', clubError);
        throw new Error(clubError?.message || 'Error creating club');
      }
      
      console.log('[useClubManagement] Club created:', data);

      // Add the creator as an admin member
      const { error: memberError } = await safeSupabase
        .from('club_members')
        .insert({
          club_id: data.id,
          user_id: currentUser.id,
          is_admin: true
        });

      if (memberError) {
        console.error('[useClubManagement] Error adding member:', memberError);
        throw new Error(memberError.message);
      }

      console.log('[useClubManagement] Added user as club admin');

      // Since we can't rely on complex joins with the current setup,
      // we'll create a club object directly
      const newClub: Club = {
        id: data.id,
        name: data.name,
        logo: data.logo || '/placeholder.svg',
        division: data.division.toLowerCase() as Club['division'],
        tier: data.tier,
        elitePoints: data.elite_points || 0,
        bio: data.bio,
        members: [{
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '/placeholder.svg',
          isAdmin: true,
          distanceContribution: 0
        }],
        matchHistory: []
      };

      // Update user's clubs in context
      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          clubs: [...(prev.clubs || []), newClub]
        };
      });

      setSelectedClub(newClub);
      
      console.log('[useClubManagement] Club creation process completed successfully');
      
      toast({
        title: "Club created",
        description: `Successfully created ${data.name}!`
      });

      return newClub;
    } catch (error) {
      console.error('[useClubManagement] Error in createClub:', error);
      toast({
        title: "Error creating club",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingClub(false);
    }
  };

  return {
    selectedClub,
    setSelectedClub,
    createClub,
    isCreatingClub
  };
};
