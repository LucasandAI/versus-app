
import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { PopoverContent, PopoverTrigger, Popover } from "@/components/ui/popover";
import UserAvatar from '../../shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';

interface ClubMember {
  id: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface ClubMembersPopoverProps {
  clubId: string;
  clubName: string;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const ClubMembersPopover: React.FC<ClubMembersPopoverProps> = ({
  clubId,
  clubName,
  onSelectUser
}) => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { navigateToUserProfile } = useNavigation();

  // Fetch club members when component mounts
  useEffect(() => {
    const fetchClubMembers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('club_members')
          .select(`
            user_id,
            is_admin,
            users:user_id (
              id, 
              name, 
              avatar
            )
          `)
          .eq('club_id', clubId);

        if (error) {
          console.error('Error fetching club members:', error);
          return;
        }

        // Transform data into the expected format
        const membersList = data.map(item => ({
          id: item.users.id,
          name: item.users.name,
          avatar: item.users.avatar,
          isAdmin: item.is_admin
        }));

        setMembers(membersList);
      } catch (error) {
        console.error('Failed to fetch club members:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchClubMembers();
    }
    
    const handleDataUpdate = () => {
      // Refetch members when data is updated
      if (clubId) {
        fetchClubMembers();
      }
    };
    
    window.addEventListener('userDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [clubId]);

  const handleUserClick = (member: ClubMember) => {
    if (onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    } else {
      navigateToUserProfile(member.id, member.name, member.avatar);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer p-1 hover:bg-gray-200 rounded-full" title="View club members">
          <Users size={16} className="text-gray-500" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <h4 className="text-sm font-medium mb-2">{clubName || 'Club'} Members</h4>
        {loading ? (
          <div className="flex justify-center py-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.length > 0 ? (
              members.map(member => (
                <div 
                  key={member.id} 
                  className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md cursor-pointer" 
                  onClick={() => handleUserClick(member)}
                >
                  <UserAvatar 
                    name={member.name} 
                    image={member.avatar} 
                    size="sm" 
                    className="cursor-pointer" 
                    onClick={e => {
                      e && e.stopPropagation();
                      handleUserClick(member);
                    }} 
                  />
                  <div className="flex-1">
                    <span className="text-sm truncate cursor-pointer hover:text-primary">
                      {member.name}
                    </span>
                    {member.isAdmin && (
                      <span className="text-xs ml-2 bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                No members found
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ClubMembersPopover;
