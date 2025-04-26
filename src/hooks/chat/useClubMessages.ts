
import { useRef } from 'react';
import { Club } from '@/types';
import { useClubMessageState } from './messages/useClubMessageState';
import { useClubMessageSubscriptions } from './messages/useClubMessageSubscriptions';
import { useInitialMessages } from './messages/useInitialMessages';

export const useClubMessages = (
  userClubs: Club[],
  isOpen: boolean,
  setUnreadMessages?: (count: number) => void
) => {
  const { clubMessages, setClubMessages } = useClubMessageState();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});

  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  useInitialMessages(userClubs, isOpen, setClubMessages);

  return {
    clubMessages,
    setClubMessages,
  };
};

export type UseClubMessagesReturn = ReturnType<typeof useClubMessages>;
