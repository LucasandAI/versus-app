
import { useFormatRelativeTime } from '@/hooks/useFormatRelativeTime';

export const useMessageFormatting = () => {
  const { formatRelativeTime } = useFormatRelativeTime();
  
  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    return formatRelativeTime(isoString);
  };
  
  const getMemberName = (senderId: string, currentUserId: string | null, members: Array<{ id: string; name: string; }>) => {
    if (senderId === currentUserId) return 'You';
    
    const member = members.find(m => m.id === senderId);
    return member?.name || 'Unknown';
  };
  
  return {
    formatTime,
    getMemberName
  };
};
