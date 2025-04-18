
import { toast } from '@/hooks/use-toast';
import { Club } from '@/types';

export const findClubFromStorage = (clubId: string): Club | null => {
  try {
    const allClubs = JSON.parse(localStorage.getItem('clubs') || '[]');
    return allClubs.find((c: Club) => c.id === clubId) || null;
  } catch (error) {
    console.error('Error accessing club data:', error);
    return null;
  }
};

export const getMockClub = (clubId: string, clubName: string): Club => {
  return {
    id: clubId,
    name: clubName,
    division: 'Silver',
    tier: 3,
    logo: '/placeholder.svg',
    members: [],
    matchHistory: []
  };
};

export const handleClubError = () => {
  toast({
    title: "Error",
    description: "Could not load club details",
    variant: "destructive"
  });
};
