import { useApp } from '@/context/AppContext';

export const useMessageUser = () => {
  const { currentUser } = useApp();

  return {
    currentUserId: currentUser?.id,
    currentUserAvatar: currentUser?.avatar
  };
}; 