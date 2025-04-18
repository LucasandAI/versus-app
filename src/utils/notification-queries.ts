
import { Notification, Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const getNotificationsFromStorage = (): Notification[] => {
  try {
    const notifications = localStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error getting notifications from storage:', error);
    return [];
  }
};

export const refreshNotifications = () => {
  console.log('Refreshing notifications');
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
};

export const hasPendingInvite = (clubId: string): boolean => {
  if (!clubId) {
    console.error('No clubId provided to hasPendingInvite');
    return false;
  }
  
  console.log('Checking pending invite for club ID:', clubId);
  const storedNotifications = localStorage.getItem('notifications');
  if (!storedNotifications) {
    console.log('No notifications found in storage');
    return false;
  }
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    console.log('All notifications:', notifications);
    
    const pendingInvites = notifications.filter(notification => {
      const isInvitation = notification.type === 'invitation';
      const isForThisClub = notification.clubId === clubId;
      const isUnread = !notification.read;
      
      console.log(`Checking notification: type=${notification.type}, clubId=${notification.clubId}, isUnread=${isUnread}`);
      return isInvitation && isForThisClub && isUnread;
    });
    
    console.log('Pending invites for club:', pendingInvites);
    return pendingInvites.length > 0;
  } catch (error) {
    console.error('Error checking pending invites:', error);
    return false;
  }
};

// Club utility functions
export const findClubFromStorage = (clubId: string): Club | null => {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    
    const userData = JSON.parse(userDataStr);
    if (!userData.clubs || !Array.isArray(userData.clubs)) return null;
    
    const club = userData.clubs.find((c: Club) => c.id === clubId);
    return club || null;
  } catch (error) {
    console.error('Error finding club from storage:', error);
    return null;
  }
};

export const getMockClub = (clubId: string, clubName: string): Club | null => {
  if (!clubId || !clubName) return null;
  
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'Bronze',
    members: [],
    matchHistory: []
  };
};

export const handleClubError = (): void => {
  toast({
    title: "Club not found",
    description: "We couldn't find details for this club.",
    variant: "destructive",
  });
  console.error('Club not found or could not be loaded');
};
