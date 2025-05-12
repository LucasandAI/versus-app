import React from 'react';
import { Club } from '@/types';

export function useClubPreviewData(clubs: Club[], clubMessages: Record<string, any[]>) {
  // Compute lastMessages and sortedClubs from clubMessages
  const { lastMessages, sortedClubs } = React.useMemo(() => {
    const lastMessages: Record<string, any> = {};
    const clubsWithTimestamps = clubs.map(club => {
      const messages = clubMessages[club.id] || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      if (lastMessage) {
        lastMessages[club.id] = lastMessage;
      }
      const lastTimestamp = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
      return { club, lastTimestamp };
    });
    const sortedClubs = clubsWithTimestamps
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
      .map(item => item.club);
    return { lastMessages, sortedClubs };
  }, [clubs, clubMessages]);

  return { lastMessages, sortedClubs };
} 