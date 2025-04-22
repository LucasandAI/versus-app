
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';
import { toast } from "@/components/ui/use-toast";

const ClubDetail: React.FC = () => {
  const { selectedClub, refreshCurrentUser } = useApp();
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const { club, isLoading, error, refreshClubData } = useClubData(selectedClub?.id);

  // Handle long loading times
  useEffect(() => {
    // Set a timeout to show extended loading message after 5 seconds
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    } else {
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

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
      clubLoaded: !!club
    });
  }, [isLoading, error, selectedClub, club]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !club) {
    // Show toast notification for the error
    if (error) {
      toast({
        title: "Error Loading Club",
        description: "There was a problem loading the club details.",
        variant: "destructive",
      });
    }
    return <ErrorState error={error?.toString()} />;
  }

  return <ClubDetailContent 
    club={club} 
    onClubUpdated={refreshClubData} 
  />;
};

export default ClubDetail;
