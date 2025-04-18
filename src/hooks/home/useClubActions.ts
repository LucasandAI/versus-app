
import { useClubDialogs } from './useClubDialogs';
import { useClubJoin } from './useClubJoin';
import { availableClubs } from '@/data/availableClubs';

export const useClubActions = () => {
  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen
  } = useClubDialogs();

  const { handleRequestToJoin, handleJoinClub } = useClubJoin();

  return {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs
  };
};
