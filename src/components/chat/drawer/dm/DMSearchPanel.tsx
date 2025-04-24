
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/shared/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';

interface DMSearchPanelProps {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

// Define a simpler user type for the search panel
interface SearchUser {
  id: string;
  name: string;
  avatar?: string;
}

const DMSearchPanel: React.FC<DMSearchPanelProps> = ({ onSelectUser }) => {
  const [query, setQuery] = useState("");
  const [recentUsers, setRecentUsers] = useState<SearchUser[]>([]);
  const { currentUser } = useApp();

  // Fetch club members from user's clubs
  useEffect(() => {
    const fetchRecentUsers = async () => {
      if (!currentUser) return;

      const { data: clubMembers, error } = await supabase
        .from('club_members')
        .select(`
          user_id,
          users:user_id (
            id,
            name,
            avatar
          )
        `)
        .neq('user_id', currentUser.id)
        .limit(10);

      if (error) {
        console.error('Error fetching club members:', error);
        return;
      }

      const uniqueUsers = clubMembers.reduce((acc: SearchUser[], member: any) => {
        if (member.users && !acc.some(u => u.id === member.users.id)) {
          acc.push({
            id: member.users.id,
            name: member.users.name,
            avatar: member.users.avatar
          });
        }
        return acc;
      }, []);

      setRecentUsers(uniqueUsers);
    };

    fetchRecentUsers();
  }, [currentUser]);

  // Search users
  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) return;

    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar')
      .ilike('name', `%${value}%`)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setRecentUsers(data || []);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {recentUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id, user.name, user.avatar)}
            className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
          >
            <UserAvatar name={user.name} image={user.avatar} size="sm" />
            <span className="text-sm font-medium">{user.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DMSearchPanel;
