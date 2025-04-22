import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';
import { toast } from "@/components/ui/use-toast";

const ClubDetail: React.FC = () => {
  const { selectedClub, refreshCurrentUser } = useApp();
  const { 
    club, 
    isLoading, 
    error, 
    refreshClubData, 
    retryCount,
    lastError
  } = useClubData(selectedClub?.id);

  // Handle long loading times
  useEffect(() => {
    // Set a timeout to show extended loading message after 3 seconds
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);
    } else {
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);

  // When the component mounts, refresh user data to ensure clubs list is up to date
  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  // If club ID is not provided, show error
  useEffect(() => {
    if (!selectedClub?.id && !isLoading) {
      console.error("No club ID provided to ClubDetail component");
    }
  }, [selectedClub, isLoading]);

  // Debug the loading state
  useEffect(() => {
    console.log("ClubDetail loading state:", { 
      isLoading, 
      hasError: !!error, 
      selectedClubId: selectedClub?.id,
      clubLoaded: !!club,
      retryCount
    });
  }, [isLoading, error, selectedClub, club, retryCount]);

  const handleRetry = () => {
    console.log("Manual retry requested");
    refreshClubData();
    toast({
      title: "Retrying",
      description: "Attempting to load club data again...",
    });
  };

  // If we already have the complete club data in the selectedClub object, use it directly
  if (selectedClub && 'members' in selectedClub && 'matchHistory' in selectedClub) {
    return (
      <ClubDetailContent 
        club={selectedClub} 
        onClubUpdated={refreshClubData} 
      />
    );
  }

  // Otherwise, load the club data using the hook
  if (isLoading) {
    return (
      <LoadingState 
        timeout={loadingTimeout}
        retryCount={retryCount} 
        onRetry={handleRetry}
      />
    );
  }

  if (error || !club) {
    return (
      <ErrorState 
        error={lastError?.toString() || error?.toString()} 
        onRetry={handleRetry}
      />
    );
  }

  return (
    <ClubDetailContent 
      club={club} 
      onClubUpdated={refreshClubData} 
    />
  );
};

export default ClubDetail;
