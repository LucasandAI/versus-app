import React from 'react';
import { Club } from '@/types';

export function useClubPreviewData(clubs: Club[], clubMessages: Record<string, any[]>) {
  // Compute lastMessages and sortedClubs from clubMessages
  const { lastMessages, sortedClubs } = React.useMemo(() => {
    const lastMessages: Record<string, any> = {};
    const clubsWithTimestamps = clubs.map(club => {
      const messages = clubMessages[club.id] || [];
      // Always find the message with the highest timestamp
      const lastMessage = messages.reduce((latest, msg) => {
        if (!latest) return msg;
        return new Date(msg.timestamp).getTime() > new Date(latest.timestamp).getTime() ? msg : latest;
      }, null);
      if (lastMessage) {
        lastMessages[club.id] = lastMessage;
      }
      const lastTimestamp = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
      return { club, lastTimestamp };
    });
    const sortedClubs = clubsWithTimestamps
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
      .map(item => item.club);
    console.log('[useClubPreviewData] Recalculated preview data', { lastMessages, sortedClubs });
    return { lastMessages, sortedClubs };
  }, [clubs, clubMessages]);

  return { lastMessages, sortedClubs };
} 