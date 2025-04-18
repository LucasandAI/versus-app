
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';
import MatchProgressBar from '../shared/MatchProgressBar';
import { formatLeagueWithTier } from '@/lib/format';

interface ClubCardProps {
  club: Club;
  onSelectClub: (club: Club) => void;
  onSelectUser: (userId: string, name: string) => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onSelectClub, onSelectUser }) => {
  const [expanded, setExpanded] = useState(false);

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
      onClick={() => onSelectClub(club)}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="bg-gray-200 h-12 w-12 rounded-full flex items-center justify-center">
              <span className="font-bold text-gray-700">{club.name.substring(0, 2)}</span>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium">{club.name}</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {formatLeagueWithTier(club.division, club.tier)}
            </span>
            <span className="text-xs text-gray-500">
              • {club.members.length} members
            </span>
          </div>
        </div>
      </div>

      {club.currentMatch && (
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Current Match</h4>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              {getDaysRemaining(club.currentMatch.endDate)} days left
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-3 text-sm">
            <span className="font-medium cursor-pointer hover:text-primary">
              {club.currentMatch.homeClub.name}
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="font-medium cursor-pointer hover:text-primary">
              {club.currentMatch.awayClub.name}
            </span>
          </div>

          <MatchProgressBar
            homeDistance={club.currentMatch.homeClub.totalDistance}
            awayDistance={club.currentMatch.awayClub.totalDistance}
          />

          <div className="mt-4">
            <button 
              className="w-full py-2 text-sm text-primary flex items-center justify-center"
              onClick={toggleExpanded}
            >
              {expanded ? 'Hide Details' : 'View Details'} 
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            
            {expanded && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium mb-2">Home Club Members</p>
                  {club.currentMatch.homeClub.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 mb-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(member.id, member.name);
                      }}
                    >
                      <UserAvatar name={member.name} image={member.avatar} size="sm" />
                      <div>
                        <p className="text-xs font-medium hover:text-primary">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Away Club Members</p>
                  {club.currentMatch.awayClub.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 mb-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(member.id, member.name);
                      }}
                    >
                      <UserAvatar name={member.name} image={member.avatar} size="sm" />
                      <div>
                        <p className="text-xs font-medium hover:text-primary">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubCard;
