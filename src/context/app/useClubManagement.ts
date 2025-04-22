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

      // Fetch the complete club data including members
      const { data: fullClubData, error: fetchError } = await safeSupabase
        .from('clubs')
        .select(`
          *,
          members:club_members(
            users(*)
          )
        `)
        .eq('id', clubData.id)
        .single();

      if (fetchError || !fullClubData) {
        throw new Error(fetchError?.message || 'Error fetching club data');
      }

      // Transform the data to match our Club type
      const newClub: Club = {
        id: fullClubData.id,
        name: fullClubData.name,
        logo: fullClubData.logo || '/placeholder.svg',
        division: fullClubData.division.toLowerCase() as Club['division'],
        tier: fullClubData.tier,
        elitePoints: fullClubData.elite_points || 0,
        bio: fullClubData.bio,
        members: Array.isArray(fullClubData.members) 
          ? fullClubData.members.map((member: any) => ({
              id: member.users.id,
              name: member.users.name,
              avatar: member.users.avatar || '/placeholder.svg',
              isAdmin: member.is_admin,
              distanceContribution: 0
            }))
          : [],
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
