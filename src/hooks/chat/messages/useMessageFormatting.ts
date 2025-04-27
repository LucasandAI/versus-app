
export const useMessageFormatting = () => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short', // e.g., "Apr"
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    // Add year if it's not the current year
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric';
    }

    return date.toLocaleDateString(undefined, options);
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
