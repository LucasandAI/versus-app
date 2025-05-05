
import React, { useState } from 'react';
import { Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { ChevronDown } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from "@/components/ui/button";
import { useClubNavigation } from '@/hooks/useClubNavigation';
import { formatLeague } from '@/utils/club/leagueUtils';

interface ClubCurrentMatchProps {
  match: Match;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({ match, onViewProfile }) => {
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const { navigateToClub } = useClubNavigation();

  const handleMemberClick = (member: any) => {
    onViewProfile(member.id, member.name, member.avatar);
  };

  const handleClubClick = (club: any) => {
    navigateToClub({
      id: club.id,
      name: club.name,
      logo: club.logo,
      members: club.members,
      matchHistory: []
    });
  };

  return (
    <div className="mt-6">
      <h3 className="font-bold text-md mb-4">Current Match</h3>
      <div className="flex justify-between items-center mb-3">
        <div 
          className="text-center cursor-pointer"
          onClick={() => handleClubClick(match.homeClub)}
        >
          <UserAvatar 
            name={match.homeClub.name} 
            image={match.homeClub.logo} 
            size="md"
            className="h-14 w-14 mx-auto cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handleClubClick(match.homeClub);
            }}
          />
          <h3 className="mt-1 font-medium text-sm hover:text-primary">
            {match.homeClub.name}
          </h3>
          <div className="flex flex-col items-center mt-1">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {formatLeague(match.homeClub.division as any, match.homeClub.tier as any)}
            </span>
            <p className="font-bold text-lg mt-1">
              {match.homeClub.totalDistance.toFixed(1)} km
            </p>
          </div>
        </div>

        <div className="text-center px-2">
          <span className="text-xs font-medium text-gray-500 uppercase">VS</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full block mt-1">
            Ends in 3 days
          </span>
        </div>

        <div 
          className="text-center cursor-pointer"
          onClick={() => handleClubClick(match.awayClub)}
        >
          <UserAvatar 
            name={match.awayClub.name} 
            image={match.awayClub.logo} 
            size="md"
            className="h-14 w-14 mx-auto cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handleClubClick(match.awayClub);
            }}
          />
          <h3 className="mt-1 font-medium text-sm hover:text-primary">
            {match.awayClub.name}
          </h3>
          <div className="flex flex-col items-center mt-1">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {formatLeague(match.awayClub.division as any, match.awayClub.tier as any)}
            </span>
            <p className="font-bold text-lg mt-1">
              {match.awayClub.totalDistance.toFixed(1)} km
            </p>
          </div>
        </div>
      </div>

      <MatchProgressBar
        homeDistance={match.homeClub.totalDistance}
        awayDistance={match.awayClub.totalDistance}
        className="mb-4"
      />
      
      <Button 
        variant="link" 
        size="sm" 
        className="w-full mt-2 mb-2 text-sm flex items-center justify-center"
        onClick={() => setShowMatchDetails(!showMatchDetails)}
      >
        {showMatchDetails ? 'Hide Team Contributions' : 'View Team Contributions'} 
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMatchDetails ? 'rotate-180' : ''}`} />
      </Button>
      
      {showMatchDetails && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
          <div>
            <p className="text-sm font-medium mb-2">{match.homeClub.name}</p>
            <div className="space-y-2">
              {match.homeClub.members.map(member => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded p-1"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar 
                      name={member.name} 
                      image={member.avatar} 
                      size="sm" 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e && e.stopPropagation();
                        handleMemberClick(member);
                      }}
                    />
                    <span className="text-sm hover:text-primary">{member.name}</span>
                  </div>
                  <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{match.awayClub.name}</p>
            <div className="space-y-2">
              {match.awayClub.members.map(member => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded p-1"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar 
                      name={member.name} 
                      image={member.avatar} 
                      size="sm" 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e && e.stopPropagation();
                        handleMemberClick(member);
                      }}
                    />
                    <span className="text-sm hover:text-primary">{member.name}</span>
                  </div>
                  <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubCurrentMatch;
