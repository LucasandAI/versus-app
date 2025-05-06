import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';
import { Users } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';

interface NeedMoreMembersCardProps {
  club: Club;
}

const NeedMoreMembersCard: React.FC<NeedMoreMembersCardProps> = ({ club: initialClub }) => {
  const [club, setClub] = useState(initialClub);
  const memberCount = club.members.length;
  const neededMembers = 5 - memberCount;
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };

  // Set up real-time subscription to club member changes
  useEffect(() => {
    // Update club data when the prop changes
    setClub(initialClub);

    // Listen for real-time changes to club members
    const channel = supabase
      .channel(`club-members-${club.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${club.id}`
        },
        () => {
          // When members change, trigger a refresh
          console.log(`[NeedMoreMembersCard] Club members changed for ${club.id}, refreshing...`);
          window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
            detail: { clubId: club.id }
          }));
        }
      )
      .subscribe();
      
    // Listen for clubMembershipChanged events
    const handleMembershipChange = (event: CustomEvent) => {
      if (event.detail?.clubId === club.id) {
        // Fetch updated club data
        console.log(`[NeedMoreMembersCard] Membership changed event received`);
      }
    };
    
    window.addEventListener('clubMembershipChanged', handleMembershipChange as EventListener);
    window.addEventListener('userDataUpdated', () => setClub(initialClub));
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('clubMembershipChanged', handleMembershipChange as EventListener);
      window.removeEventListener('userDataUpdated', () => setClub(initialClub));
    };
  }, [club.id, initialClub]);
  
  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3 cursor-pointer"
            onClick={handleClubClick}
          />
          <div>
            <h3 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={handleClubClick}
            >
              {club.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {formatLeague(club.division, club.tier)}
              </span>
              <span className="text-xs text-gray-500">
                • {memberCount}/5 members
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
          <div className="flex items-center mb-2">
            <Users size={18} className="text-primary mr-2" />
            <span className="text-sm font-medium">
              {memberCount}/5 members
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Your club needs {neededMembers} more {neededMembers === 1 ? 'member' : 'members'} to start competing in the league.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeedMoreMembersCard;
