
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, User } from '@/types';
import { transformRawMatchesToMatchType } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { toast } from '@/hooks/use-toast';

export const useUserProfileStateLogic = () => {
  const { currentUser, selectedUser, setCurrentUser, setSelectedUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [weeklyDistance, setWeeklyDistance] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      if (!selectedUser) return;
      setLoading(true);
      
      try {
        console.log('Loading user data for:', selectedUser.id);
        
        // Fetch user data from Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
          .eq('id', selectedUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setLoading(false);
          toast({
            title: "Error loading profile",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (!userData) {
          console.error('No user data found');
          setLoading(false);
          return;
        }

        console.log('User data fetched:', userData);

        // Fetch user's clubs from Supabase via club_members join table
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club_id, is_admin')
          .eq('user_id', selectedUser.id);

        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
        }

        // Transform the clubs data
        const clubs: Club[] = [];
        if (memberships && memberships.length > 0) {
          for (const membership of memberships) {
            // Fetch club details
            const { data: clubData, error: clubError } = await supabase
              .from('clubs')
              .select('id, name, logo, division, tier, elite_points, bio')
              .eq('id', membership.club_id)
              .single();

            if (clubError || !clubData) {
              console.error('Error fetching club details:', clubError);
              continue;
            }

            // Fetch club members
            const { data: membersData, error: membersError } = await supabase
              .from('club_members')
              .select('user_id, is_admin')
              .eq('club_id', membership.club_id);

            if (membersError) {
              console.error('Error fetching club members:', membersError);
              continue;
            }

            // Fetch members' user details
            const members: ClubMember[] = [];
            for (const member of membersData) {
              const { data: memberUserData, error: memberUserError } = await supabase
                .from('users')
                .select('id, name, avatar')
                .eq('id', member.user_id)
                .single();

              if (memberUserError || !memberUserData) {
                console.error('Error fetching member user data:', memberUserError);
                continue;
              }
              members.push({
                id: memberUserData.id,
                name: memberUserData.name || 'Unknown User',
                avatar: memberUserData.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: 0 // Default value
              });
            }

            // Fetch match history
            const { data: matchHistory, error: matchError } = await supabase
              .from('matches')
              .select('*')
              .or(`home_club_id.eq.${clubData.id},away_club_id.eq.${clubData.id}`)
              .order('end_date', { ascending: false });

            if (matchError) {
              console.error('Error fetching match history:', matchError);
            }

            // Transform match data
            const transformedMatches = transformRawMatchesToMatchType(matchHistory || [], clubData.id);

            // Determine correct division value
            const divisionValue = ensureDivision(clubData.division);

            // Transform club data
            clubs.push({
              id: clubData.id,
              name: clubData.name,
              logo: clubData.logo || '/placeholder.svg',
              division: divisionValue,
              tier: clubData.tier || 1,
              elitePoints: clubData.elite_points || 0,
              members: members,
              matchHistory: transformedMatches,
              bio: clubData.bio || 'No description available'
            });
          }
        }

        // Calculate weekly distance (placeholder logic)
        const randomWeeklyDistance = Math.round((Math.random() * 50 + 20) * 10) / 10;
        setWeeklyDistance(randomWeeklyDistance);

        // Update the selected user with the fetched data
        const updatedUser: User = {
          id: userData.id,
          name: userData.name || 'Unknown User',
          avatar: userData.avatar || '/placeholder.svg',
          bio: userData.bio || '',
          instagram: userData.instagram || '',
          twitter: userData.twitter || '',
          facebook: userData.facebook || '',
          linkedin: userData.linkedin || '',
          website: userData.website || '',
          tiktok: userData.tiktok || '',
          clubs: clubs
        };

        console.log('Updated user data:', updatedUser);
        setSelectedUser(updatedUser);

        // If this is the current user, update currentUser as well
        if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error loading profile data",
          description: "There was a problem loading profile information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    
    // Listen for profile update events
    const handleProfileUpdate = () => {
      loadUserData();
    };
    
    window.addEventListener('userDataUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleProfileUpdate);
    };
    
  }, [selectedUser?.id, currentUser, setCurrentUser, setSelectedUser]);

  return { loading, weeklyDistance };
};
