export const useMessageFormatting = () => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  const getMemberName = (senderId: string, currentUserId: string | null, clubMembers: Array<{ id: string; name: string }>) => {
    if (currentUserId && String(senderId) === String(currentUserId)) return 'You';
    const member = clubMembers.find(m => String(m.id) === String(senderId));
    return member ? member.name : 'Unknown Member';
  };

  return {
    formatTime,
    getMemberName
  };
};
