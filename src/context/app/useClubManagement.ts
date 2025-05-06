
import { useState } from 'react';
import { Club, User } from './types';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

export const useClubManagement = (
  currentUser: User | null, 
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const createClub = async (name: string, logo: string = '/placeholder.svg'): Promise<Club | null> => {
    if (!currentUser) {
      toast({
        title: "Error creating club",
        description: "You must be logged in to create a club",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      // Insert the new club
      const { data: clubData, error: clubError } = await safeSupabase
        .from('clubs')
        .insert({
          name,
          logo,
          division: 'bronze',
          tier: 5,
          elite_points: 0,
          created_by: currentUser.id,
          bio: `Welcome to ${name}! We're a group of passionate runners looking to challenge ourselves and improve together.`,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (clubError || !clubData) {
        throw new Error(clubError?.message || 'Error creating club');
      }

      // Add the creator as an admin member
      const { error: memberError } = await safeSupabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: currentUser.id,
          is_admin: true
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      // Since we can't rely on complex joins with the current setup,
      // we'll create a club object directly
      const newClub: Club = {
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: clubData.division.toLowerCase() as Club['division'],
        tier: clubData.tier,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio,
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
          clubs: [...prev.clubs, newClub]
        };
      });

      setSelectedClub(newClub);
      
      toast({
        title: "Club created",
        description: `Successfully created ${name}!`
      });

      return newClub;
    } catch (error) {
      console.error('Error in createClub:', error);
      toast({
        title: "Error creating club",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    selectedClub,
    setSelectedClub,
    createClub
  };
};
