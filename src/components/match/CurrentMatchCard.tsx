
import React from 'react';
import { Match, Club } from '@/types';
import MatchDisplay from './MatchDisplay';

interface CurrentMatchCardProps {
  match: Match;
  userClub: Club;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({
  match,
  userClub,
  onViewProfile
}) => {
  // Simple wrapper component to maintain API compatibility
  return (
    <MatchDisplay
      match={match}
      userClub={userClub}
      onViewProfile={onViewProfile}
    />
  );
};

export default CurrentMatchCard;
