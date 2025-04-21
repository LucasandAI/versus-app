
import { useNavigate } from 'react-router-dom';
import { Club } from '@/types';

export const useClubNavigation = () => {
  const navigate = useNavigate();

  const navigateToClub = (club: Partial<Club>) => {
    navigate(`/clubs/${club.id}`);
  };

  return { navigateToClub };
};
