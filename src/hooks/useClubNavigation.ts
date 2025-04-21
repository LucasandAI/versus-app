
import { useApp } from '@/context/AppContext';
import { Club, Division } from '@/types';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { slugifyClubName } from '@/utils/slugify';
import { useNavigate } from 'react-router-dom';
import { ensureClubHasSlug } from '@/utils/club/clubUtils';

export const useClubNavigation = () => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();
  const navigate = useNavigate();

  const navigateToClub = (club: Partial<Club>) => {
    // Ensure we have a slug
    const clubName = club.name || '';
    const clubSlug = club.slug || slugifyClubName(clubName);
    
    // Check if it's one of the user's clubs first
    const userClub = currentUser?.clubs.find(c => c.id === club.id);
    
    if (userClub) {
      // Make sure user club has a slug
      const updatedClub = ensureClubHasSlug(userClub);
      setSelectedClub(updatedClub);
      
      // Navigate to the club page
      navigate(`/clubs/${updatedClub.slug}`);
      return;
    }

    // For non-member clubs, create a complete club object with generated match history
    const completeClub: Club = {
      id: club.id || `club-${Date.now()}`,
      name: club.name || '',
      logo: club.logo || '/placeholder.svg',
      division: club.division as Division || 'Bronze',
      tier: club.tier || 5,
      slug: clubSlug,
      members: club.members || [],
      matchHistory: []
    };

    // Generate match history for the club
    completeClub.matchHistory = generateMatchHistoryFromDivision(completeClub);

    setSelectedClub(completeClub);
    navigate(`/clubs/${clubSlug}`);
  };

  return { navigateToClub };
};
