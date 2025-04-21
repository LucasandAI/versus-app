
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import ClubDetail from '@/components/ClubDetail';
import GoBackHome from '@/components/shared/GoBackHome';
import { findClubBySlug, generateFallbackClub } from '@/utils/club';

const ClubPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, setSelectedClub } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      navigate('/');
      return;
    }

    // Try to find the club in the user's clubs
    const userClub = currentUser?.clubs.find(c => c.slug === slug);
    
    if (userClub) {
      setSelectedClub(userClub);
      setLoading(false);
      return;
    }

    // If not found, generate a fallback club
    const fallbackClub = generateFallbackClub(slug);
    setSelectedClub(fallbackClub);
    setLoading(false);
  }, [slug, currentUser, setSelectedClub, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <ClubDetail />;
};

export default ClubPage;
